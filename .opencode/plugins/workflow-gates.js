/**
 * OpenCode plugin: ports the repo's two Claude-Code-specific gates so an
 * OpenCode session in this container enforces the same workflow rules.
 *
 * 1. Plan-before-edit — blocks write/edit/patch tool calls on implementation
 *    files until an issue is assigned to the viewer and its Plan section is
 *    filled. Same shared work cache and semantics as
 *    `.claude/hooks/require-plan.sh`.
 * 2. End-of-turn quality gate — on the `session.idle` event, runs
 *    `.claude/hooks/stop-quality-gate-repo.mjs` (per-package `tsc --noEmit` +
 *    `vitest related` on changed files) and surfaces failures. Notify-only:
 *    OpenCode has no forced-continuation semantics, so the git pre-push hook,
 *    CI, and PR review remain the hard backstops.
 *
 * Fail-open policy mirrors the Claude Code hooks: a missing cache, unusable
 * git environment, or unexpected payload never blocks work. The one place this
 * plugin is deliberately fail-closed is a plan-gated edit tool that carries no
 * resolvable file path (e.g. the multi-file `patch` tool): the plan condition
 * still applies, so an unplanned patch cannot slip through the gate.
 *
 * The gate decision logic is exported as pure functions and covered by
 * `scripts/workflow-gates.test.ts`.
 */

import { execFileSync, spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * @typedef {object} WorkIssue
 * @property {number} [number]
 * @property {string} [state]
 * @property {string[]} [assignees]
 * @property {string} [body]
 */

/**
 * @typedef {object} WorkCache
 * @property {{ issues?: WorkIssue[]; viewerLogin?: string }} [snapshot]
 */

/**
 * @typedef {object} GitContext
 * @property {string} containerDir - parent of the shared git dir; the enforcement scope
 * @property {string} cachePath - `<git-common-dir>/work-cache.json`
 */

/**
 * @typedef {object} OpencodeClient
 * @property {{ showToast?: (input: { body: { message: string; variant?: string } }) => Promise<unknown> }} [tui]
 */

const PLAN_GATED_TOOLS = new Set(['write', 'edit', 'patch']);
const GIT_TIMEOUT_MS = 10_000;
const GATE_TIMEOUT_MS = 240_000;

/**
 * Plugin factory. OpenCode calls it once per session with the plugin context.
 *
 * @param {{ directory: string; worktree?: string; client?: OpencodeClient }} context
 * @returns {Promise<Record<string, unknown>>} hook map
 */
export const WorkflowGates = async ({ directory, worktree, client }) => {
	const workingDir = worktree ?? directory;
	const gitContext = resolveGitContext(workingDir);
	let isQualityGateRunning = false;

	return {
		/**
		 * Plan-before-edit gate. Throwing blocks the tool call.
		 *
		 * @param {{ tool: string }} input
		 * @param {{ args: Record<string, unknown> }} output
		 */
		'tool.execute.before': async (input, output) => {
			if (gitContext === undefined || !PLAN_GATED_TOOLS.has(input.tool)) return;
			const cache = readWorkCache(gitContext.cachePath);
			if (cache === undefined) return;
			const filePath = output.args.filePath;
			// write/edit carry a filePath (path-scoped exemptions apply); a
			// gated tool without one (e.g. multi-file patch) still faces the
			// path-independent plan condition, so it cannot bypass the gate.
			const reason =
				typeof filePath === 'string' && filePath.length > 0
					? findBlockReason(
							cache,
							path.resolve(workingDir, filePath),
							gitContext.containerDir,
						)
					: planBlockReason(cache);
			if (reason !== undefined) throw new Error(reason);
		},

		/**
		 * OpenCode delivers session lifecycle signals through the generic event
		 * hook; `session.idle` is our end-of-turn trigger (notify-only).
		 *
		 * @param {{ event: { type: string } }} input
		 */
		event: async (input) => {
			if (input.event?.type !== 'session.idle') return;
			if (isQualityGateRunning) return;
			isQualityGateRunning = true;
			try {
				const failures = await runStopQualityGate(workingDir);
				if (failures !== undefined) {
					await notify(
						client,
						`Quality gate failed (tsc/vitest on changed files):\n${failures}`,
					);
				}
			} finally {
				isQualityGateRunning = false;
			}
		},
	};
};

/**
 * True when the issue body's `## Plan` section has real content (not the
 * `_Filled ..._` placeholder from the work:v1 template).
 *
 * @param {string | undefined} body
 * @returns {boolean}
 */
export function planFilled(body) {
	const lines = String(body ?? '').split('\n');
	const startIndex = lines.findIndex((line) => /^## Plan\s*$/.test(line));
	if (startIndex === -1) return false;
	const endIndex = lines.findIndex(
		(line, index) => index > startIndex && /^## /.test(line),
	);
	const section = lines
		.slice(startIndex + 1, endIndex === -1 ? undefined : endIndex)
		.join('\n')
		.trim();
	return section.length > 0 && !section.startsWith('_Filled');
}

/**
 * Paths outside the container scope, and agent/archive paths inside it
 * (`work/`, `.claude/`, `.opencode/`), are never plan-gated.
 *
 * @param {string} resolvedPath - absolute path of the file being written
 * @param {string} containerDir - enforcement scope (the worktree container)
 * @returns {boolean}
 */
export function isPathExempt(resolvedPath, containerDir) {
	if (
		resolvedPath !== containerDir &&
		!resolvedPath.startsWith(containerDir + path.sep)
	) {
		return true;
	}
	return (
		/[\\/]work[\\/]/.test(resolvedPath) ||
		/[\\/]\.claude[\\/]/.test(resolvedPath) ||
		/[\\/]\.opencode[\\/]/.test(resolvedPath)
	);
}

/**
 * Path-independent half of the gate: block when the viewer has no assigned open
 * issue, or when every assigned issue's Plan is unfilled; with several
 * assigned, one filled Plan is enough (that is the one being worked). Mirrors
 * `.claude/hooks/require-plan.sh`.
 *
 * @param {WorkCache} cache
 * @returns {string | undefined} block reason, or undefined to allow
 */
export function planBlockReason(cache) {
	const snapshot = cache.snapshot ?? {};
	const issues = Array.isArray(snapshot.issues) ? snapshot.issues : [];
	const viewer = snapshot.viewerLogin ?? '';
	const activeIssues = issues.filter(
		(issue) =>
			issue.state === 'OPEN' &&
			Array.isArray(issue.assignees) &&
			issue.assignees.includes(viewer),
	);
	if (activeIssues.length === 0) {
		return [
			'No assigned issue — claim one before writing implementation files.',
			'  pnpm run work next',
			'  pnpm run work claim <number>',
		].join('\n');
	}
	const unplannedIssues = activeIssues.filter(
		(issue) => !planFilled(issue.body),
	);
	if (unplannedIssues.length === activeIssues.length) {
		const refs = activeIssues.map((issue) => `#${issue.number}`).join(', ');
		return [
			`Assigned issue(s) ${refs} have an unfilled Plan section — fill one before writing implementation files.`,
			'1. Plan with a strong model (plan mode)',
			'2. pnpm run work plan <number>  (plan text on stdin or --file)',
			'3. Retry once the plan is recorded.',
		].join('\n');
	}
	return undefined;
}

/**
 * Full gate decision for a path-carrying edit: exempt paths are always
 * allowed; otherwise the plan condition applies.
 *
 * @param {WorkCache} cache
 * @param {string} resolvedPath
 * @param {string} containerDir
 * @returns {string | undefined} block reason, or undefined to allow
 */
export function findBlockReason(cache, resolvedPath, containerDir) {
	if (isPathExempt(resolvedPath, containerDir)) return undefined;
	return planBlockReason(cache);
}

/**
 * Derives the enforcement scope and cache path from the shared git dir, so it
 * is correct from both the container and any linked worktree.
 *
 * @param {string} startDir
 * @returns {GitContext | undefined} undefined when git is unusable (fail open)
 */
function resolveGitContext(startDir) {
	try {
		const commonDir = execFileSync(
			'git',
			[
				'-C',
				startDir,
				'rev-parse',
				'--path-format=absolute',
				'--git-common-dir',
			],
			{ stdio: ['ignore', 'pipe', 'ignore'], timeout: GIT_TIMEOUT_MS },
		)
			.toString()
			.trim();
		return {
			containerDir: path.dirname(commonDir),
			cachePath: path.join(commonDir, 'work-cache.json'),
		};
	} catch {
		return undefined;
	}
}

/**
 * @param {string} cachePath
 * @returns {WorkCache | undefined} undefined when missing/unparsable (fail open)
 */
function readWorkCache(cachePath) {
	try {
		return JSON.parse(readFileSync(cachePath, 'utf8'));
	} catch {
		console.error(
			'workflow-gates: no work cache; run `pnpm run work list` to seed it.',
		);
		return undefined;
	}
}

/**
 * Runs the repo stop gate and resolves with its failure output on exit 2,
 * undefined otherwise (fail open on spawn errors and timeouts). Uses the
 * current JS runtime (Bun under OpenCode, Node under tests) to avoid a hard
 * dependency on a `node` binary being on PATH.
 *
 * @param {string} worktreeDir
 * @returns {Promise<string | undefined>}
 */
function runStopQualityGate(worktreeDir) {
	const gateScript = path.join(
		worktreeDir,
		'.claude',
		'hooks',
		'stop-quality-gate-repo.mjs',
	);
	if (!existsSync(gateScript)) return Promise.resolve(undefined);
	return new Promise((resolvePromise) => {
		const child = spawn(process.execPath, [gateScript], {
			stdio: ['pipe', 'ignore', 'pipe'],
			timeout: GATE_TIMEOUT_MS,
		});
		let stderrText = '';
		child.stderr?.on('data', (chunk) => {
			stderrText += String(chunk);
		});
		child.on('error', () => resolvePromise(undefined));
		child.on('close', (code) => {
			resolvePromise(code === 2 ? stderrText : undefined);
		});
		// The child may exit before draining stdin; swallow the resulting EPIPE
		// rather than let it surface as an unhandled stream error.
		child.stdin?.on('error', () => {});
		child.stdin?.write(JSON.stringify({ cwd: worktreeDir }));
		child.stdin?.end();
	});
}

/**
 * Best-effort user notification: TUI toast when available, always the log.
 *
 * @param {OpencodeClient | undefined} client
 * @param {string} message
 * @returns {Promise<void>}
 */
async function notify(client, message) {
	console.error(message);
	try {
		await client?.tui?.showToast?.({ body: { message, variant: 'error' } });
	} catch {
		// The toast is optional; the log line above already carries the failure.
	}
}

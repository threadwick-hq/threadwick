/**
 * OpenCode plugin: ports the repo's two Claude-Code-specific gates so an
 * OpenCode session in this container enforces the same workflow rules.
 *
 * 1. Plan-before-edit — blocks write/edit/patch tool calls on implementation
 *    files until an issue is assigned to the viewer and its Plan section is
 *    filled. Same shared work cache and semantics as
 *    `.claude/hooks/require-plan.sh`.
 * 2. End-of-turn quality gate — on session idle, runs
 *    `.claude/hooks/stop-quality-gate-repo.mjs` (per-package `tsc --noEmit` +
 *    `vitest related` on changed files) and surfaces failures. Notify-only:
 *    OpenCode has no forced-continuation semantics, so the git pre-push hook,
 *    CI, and PR review remain the hard backstops.
 *
 * Fail-open policy mirrors the Claude Code hooks: a missing cache, unusable
 * git environment, or unexpected payload never blocks work.
 *
 * The gate logic is exported as pure functions and covered by
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
			const filePath = output.args['filePath'];
			if (typeof filePath !== 'string' || filePath.length === 0) return;
			const cache = readWorkCache(gitContext.cachePath);
			if (cache === undefined) return;
			const resolvedPath = path.resolve(directory, filePath);
			const reason = findBlockReason(cache, resolvedPath, gitContext.containerDir);
			if (reason !== undefined) throw new Error(reason);
		},

		/** End-of-turn quality gate (notify-only). */
		'session.idle': async () => {
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
 * Decides whether a write should be blocked. Mirrors
 * `.claude/hooks/require-plan.sh`: block when the viewer has no assigned open
 * issue, or when every assigned issue's Plan is unfilled; with several
 * assigned, one filled Plan is enough (that is the one being worked).
 *
 * @param {WorkCache} cache
 * @param {string} resolvedPath
 * @param {string} containerDir
 * @returns {string | undefined} block reason, or undefined to allow
 */
export function findBlockReason(cache, resolvedPath, containerDir) {
	if (isPathExempt(resolvedPath, containerDir)) return undefined;
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
	const unplannedIssues = activeIssues.filter((issue) => !planFilled(issue.body));
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
			['-C', startDir, 'rev-parse', '--path-format=absolute', '--git-common-dir'],
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
 * undefined otherwise (fail open on spawn errors and timeouts).
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
		const child = spawn('node', [gateScript], {
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

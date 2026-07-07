// PreToolUse — block Write/Edit of repo implementation files until the viewer
// has an assigned open issue with a filled Plan section (read from the shared
// work cache; no network). Writes outside the repo container (plan-mode plan
// files, Claude memory, scratchpad), to work/ archive files, and to .claude/
// agent config are always allowed. Fails open with a warning when no cache
// exists yet — a missing cache must never block all edits.
// Entry point: require-plan.sh (thin shim; keeps hook wiring paths stable).
import { readFileSync } from 'node:fs';
import { dirname, resolve, sep } from 'node:path';
import { resolveGitCommonDir } from './lib/git.mjs';
import { activeIssues, readWorkCache, unplannedIssues } from './lib/plan.mjs';

function block(reason) {
	process.stdout.write(JSON.stringify({ decision: 'block', reason }));
	process.exit(0);
}

try {
	let filePath = '';
	try {
		const payload = JSON.parse(readFileSync(0, 'utf8'));
		filePath = payload?.tool_input?.file_path ?? '';
	} catch {
		// Unparsable payload → no extractable file_path → fail open below.
	}
	// A degenerate payload (no extractable file_path) must fail open — resolving
	// '' would collapse to cwd, which sits inside the scope and could block.
	if (filePath.length === 0) process.exit(0);

	// Enforcement scope is the whole container (every worktree), derived from the
	// shared git dir so it is correct from both container and worktree cwds.
	const commonDir = resolveGitCommonDir();
	const scope =
		commonDir !== undefined
			? dirname(commonDir)
			: // biome-ignore lint/suspicious/noUndeclaredEnvVars: provided by the Claude Code harness
				(process.env.CLAUDE_PROJECT_DIR ?? process.cwd());
	const resolved = resolve(process.cwd(), filePath);

	// Outside the repo container — plan files, memory, scratchpad — never block.
	if (resolved !== scope && !resolved.startsWith(scope + sep)) {
		process.exit(0);
	}

	// work/ archive files and .claude/ agent config are always writable.
	if (/[\\/]work[\\/]/.test(resolved) || /[\\/]\.claude[\\/]/.test(resolved)) {
		process.exit(0);
	}

	const cache = readWorkCache(
		commonDir === undefined ? undefined : `${commonDir}/work-cache.json`,
	);
	if (cache === undefined) {
		// Fail open, loudly: agents must run a work command to seed the cache.
		process.stderr.write(
			'require-plan: no work cache; run `pnpm run work list` to seed it.\n',
		);
		process.exit(0);
	}

	const active = activeIssues(cache);
	if (active.length === 0) {
		block(
			'No assigned issue — claim one before writing implementation files.\n' +
				'  pnpm run work next\n' +
				'  pnpm run work claim <number>',
		);
	}

	// Writes are allowed as long as at least one assigned issue is planned —
	// with several assigned, the planned one is the one being worked.
	const unplanned = unplannedIssues(active);
	if (unplanned.length === active.length) {
		const refs = active.map((issue) => `#${issue.number}`).join(', ');
		block(
			`Assigned issue(s) ${refs} have an unfilled Plan section — fill one before writing implementation files.\n` +
				'1. Use plan mode (strong model)\n' +
				'2. pnpm run work plan <number>  (plan text on stdin or --file)\n' +
				'3. This hook will then allow writes.',
		);
	}
} catch {
	// Fail-open: environment issues never block writes.
}

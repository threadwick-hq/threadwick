#!/usr/bin/env bash
# PreToolUse — block Write/Edit of repo implementation files until the viewer
# has an assigned open issue with a filled Plan section (read from the shared
# work cache; no network). Writes outside the repo container (plan-mode plan
# files, Claude memory, scratchpad), to work/ archive files, and to .claude/
# agent config are always allowed. Fails open with a warning when no cache
# exists yet — a missing cache must never block all edits.
set -euo pipefail

# Read the payload via stdin and extract only file_path in a first small node
# pass (a Write payload carries whole file contents — too large for env/argv,
# and a heredoc would shadow the payload on the main script's stdin).
input="$(cat)"
file_path="$(printf '%s' "$input" | node -e '
	const fs = require("node:fs");
	let raw = "";
	try { raw = fs.readFileSync(0, "utf8"); } catch {}
	let p = "";
	try { p = (JSON.parse(raw).tool_input || {}).file_path || ""; } catch {}
	process.stdout.write(p);
')"

# Enforcement scope is the whole container (every worktree), derived from the
# shared git dir so it is correct from both container and worktree cwds.
COMMON_DIR="$(git rev-parse --path-format=absolute --git-common-dir 2>/dev/null || true)"
if [ -z "$COMMON_DIR" ]; then
	BASE="${CLAUDE_PROJECT_DIR:-$(pwd)}"
	COMMON_DIR="$(git -C "$BASE/main" rev-parse --path-format=absolute --git-common-dir 2>/dev/null || true)"
fi
SCOPE=""
CACHE_PATH=""
if [ -n "$COMMON_DIR" ]; then
	SCOPE="$(dirname "$COMMON_DIR")"
	CACHE_PATH="$COMMON_DIR/work-cache.json"
fi
if [ -z "$SCOPE" ]; then SCOPE="${CLAUDE_PROJECT_DIR:-$(pwd)}"; fi

REQUIRE_PLAN_FILE="$file_path" REQUIRE_PLAN_SCOPE="$SCOPE" WORK_CACHE_PATH="$CACHE_PATH" node <<'NODE'
const { readFileSync } = require('node:fs');
const { resolve, sep } = require('node:path');

function block(reason) {
	process.stdout.write(JSON.stringify({ decision: 'block', reason }));
	process.exit(0);
}

try {
	const filePath = process.env.REQUIRE_PLAN_FILE || '';
	// A degenerate payload (no extractable file_path) must fail open — resolving
	// '' would collapse to cwd, which sits inside the scope and could block.
	if (filePath.length === 0) process.exit(0);
	const scope = process.env.REQUIRE_PLAN_SCOPE || process.cwd();
	const resolved = resolve(process.cwd(), filePath);

	// Outside the repo container — plan files, memory, scratchpad — never block.
	if (resolved !== scope && !resolved.startsWith(scope + sep)) {
		process.exit(0);
	}

	// work/ archive files and .claude/ agent config are always writable.
	if (/[\\/]work[\\/]/.test(resolved) || /[\\/]\.claude[\\/]/.test(resolved)) {
		process.exit(0);
	}

	let cache;
	try {
		cache = JSON.parse(
			readFileSync(process.env.WORK_CACHE_PATH ?? '', 'utf8'),
		);
	} catch {
		// Fail open, loudly: agents must run a work command to seed the cache.
		process.stderr.write(
			'require-plan: no work cache; run `pnpm run work list` to seed it.\n',
		);
		process.exit(0);
	}

	const snapshot = cache.snapshot ?? {};
	const issues = Array.isArray(snapshot.issues) ? snapshot.issues : [];
	const viewer = snapshot.viewerLogin ?? '';
	const active = issues.filter(
		(issue) =>
			issue.state === 'OPEN' &&
			Array.isArray(issue.assignees) &&
			issue.assignees.includes(viewer),
	);

	if (active.length === 0) {
		block(
			'No assigned issue — claim one before writing implementation files.\n' +
				'  pnpm run work next\n' +
				'  pnpm run work claim <number>',
		);
	}

	function planFilled(body) {
		const lines = String(body ?? '').split('\n');
		const start = lines.findIndex((l) => /^## Plan\s*$/.test(l));
		if (start === -1) return false;
		const end = lines.findIndex((l, i) => i > start && /^## /.test(l));
		const section = lines
			.slice(start + 1, end === -1 ? undefined : end)
			.join('\n')
			.trim();
		return section.length > 0 && !section.startsWith('_Filled');
	}

	// Writes are allowed as long as at least one assigned issue is planned —
	// with several assigned, the planned one is the one being worked.
	const unplanned = active.filter((issue) => !planFilled(issue.body));
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
NODE

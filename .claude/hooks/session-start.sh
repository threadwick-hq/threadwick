#!/usr/bin/env bash
# SessionStart — inject active/next work-issue context for Claude Code.
# Reads only the shared work cache (written by every `pnpm run work` command);
# never touches the network, so sessions start fast and offline-safe.
set -euo pipefail

# Resolve the shared git dir from a worktree cwd, or descend into main/ when
# the session starts at the bare+worktree container (git fatals there).
COMMON_DIR="$(git rev-parse --path-format=absolute --git-common-dir 2>/dev/null || true)"
if [ -z "$COMMON_DIR" ]; then
	BASE="${CLAUDE_PROJECT_DIR:-$(pwd)}"
	COMMON_DIR="$(git -C "$BASE/main" rev-parse --path-format=absolute --git-common-dir 2>/dev/null || true)"
fi
CACHE_PATH=""
if [ -n "$COMMON_DIR" ]; then CACHE_PATH="$COMMON_DIR/work-cache.json"; fi

WORK_CACHE_PATH="$CACHE_PATH" node <<'NODE'
const { readFileSync } = require('node:fs');

const out = ['## Work tracking (GitHub Issues)', ''];

function emit() {
	out.push('', 'See `AGENTS.md` for the lifecycle. Commands: `pnpm run work <cmd>`.');
	console.log(
		JSON.stringify({
			hookSpecificOutput: {
				hookEventName: 'SessionStart',
				additionalContext: out.join('\n'),
			},
		}),
	);
}

let cache;
try {
	cache = JSON.parse(readFileSync(process.env.WORK_CACHE_PATH ?? '', 'utf8'));
} catch {
	out.push(
		'No work cache yet. Fetch the current work state first:',
		'  pnpm run work list',
	);
	emit();
	process.exit(0);
}

const snapshot = cache.snapshot ?? {};
const issues = Array.isArray(snapshot.issues) ? snapshot.issues : [];
const viewer = snapshot.viewerLogin ?? '';

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

const active = issues.filter(
	(issue) =>
		issue.state === 'OPEN' &&
		Array.isArray(issue.assignees) &&
		issue.assignees.includes(viewer),
);

if (active.length > 0) {
	out.push('**Active issue(s):**');
	for (const issue of active) {
		out.push(`- #${issue.number} ${issue.title} (${issue.status})`);
	}
	out.push('', 'Continue the active issue. Read it with `pnpm run work show <number>`.');
	const unplanned = active.filter((issue) => !planFilled(issue.body));
	if (unplanned.length > 0) {
		out.push('', '**PLAN REQUIRED before writing implementation files.**');
		for (const issue of unplanned) {
			out.push(`#${issue.number} has an unfilled Plan section.`);
		}
		out.push('1. Use plan mode (strong model)');
		out.push('2. pnpm run work plan <number>  (plan text on stdin or --file)');
		out.push('3. The require-plan hook blocks writes until this is done.');
	}
	const cutoff = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
	const stale = active.filter((issue) => (issue.updatedAt ?? '') < cutoff);
	if (stale.length > 0) {
		out.push('', '**STALE ACTIVE ISSUE(S)** (no update >3 days):');
		for (const issue of stale) out.push(`  #${issue.number}`);
	}
} else {
	const order = { p0: 0, p1: 1, p2: 2, p3: 3 };
	const next = issues
		.filter((issue) => issue.status === 'backlog' && issue.triaged === true)
		.sort(
			(a, b) =>
				(order[a.priority] ?? 4) - (order[b.priority] ?? 4) ||
				String(a.createdAt).localeCompare(String(b.createdAt)),
		)[0];
	if (next !== undefined) {
		out.push(
			'**No active issue.** Next claimable:',
			`- #${next.number} ${next.title} (${next.priority ?? '?'})`,
			'',
			'Claim with `pnpm run work claim <number>` before implementing.',
		);
	} else {
		out.push(
			'No claimable backlog issue in the cache.',
			'  Refresh: pnpm run work list',
			'  Create:  pnpm run work new --title "..." --type feat --area repo',
		);
	}
}

if (typeof snapshot.fetchedAt === 'string') {
	out.push('', `_Cache from ${snapshot.fetchedAt}; any work command refreshes it._`);
}
emit();
NODE

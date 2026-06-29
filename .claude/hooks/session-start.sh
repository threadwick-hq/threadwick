#!/usr/bin/env bash
# SessionStart — inject active/next work task context for Claude Code.
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"

node <<'NODE'
const { execSync } = require('node:child_process');

const root = process.cwd();
const work = (args) => {
	try {
		return execSync(`pnpm exec tsx scripts/work.ts ${args}`, {
			encoding: 'utf8',
			cwd: root,
			stdio: ['ignore', 'pipe', 'ignore'],
		}).trim();
	} catch {
		return '';
	}
};

const lines = ['## Work tracking', ''];
const active = work('list --status active');
if (/^TW-/m.test(active)) {
	lines.push('**Active task(s):**', '```', active, '```', '');
	lines.push(
		'Continue the active task before claiming new work. Read the task file for Context, Scope, and Acceptance.',
	);
} else {
	const next = work('next');
	if (/^TW-/m.test(next)) {
		lines.push('**No active task.** Next claimable:', '```', next, '```', '');
		lines.push('Claim with `pnpm run work claim TW-NNN` before implementing.');
	} else {
		lines.push('No claimable backlog task matches the default filter.');
	}
}
lines.push('', 'See `AGENTS.md` and `work/README.md`.');

console.log(
	JSON.stringify({
		hookSpecificOutput: {
			hookEventName: 'SessionStart',
			additionalContext: lines.join('\n'),
		},
	}),
);
NODE

#!/usr/bin/env bash
# SessionStart — inject active/next work task context for Claude Code.
set -euo pipefail

# Resolve the repo root from either a worktree cwd (git works) or the
# bare+worktree container cwd (show-toplevel fatals there; fall back to the
# project dir and descend into main/, the canonical worktree).
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [ -z "$ROOT" ]; then ROOT="${CLAUDE_PROJECT_DIR:-$(pwd)}"; fi
if [ ! -d "$ROOT/work" ] && [ -d "$ROOT/main/work" ]; then ROOT="$ROOT/main"; fi
cd "$ROOT"

node <<'NODE'
const { execSync } = require('node:child_process');
const { readFileSync, readdirSync, existsSync } = require('node:fs');
const { join } = require('node:path');

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

function readActiveTasks() {
	const workDir = join(root, 'work');
	if (!existsSync(workDir)) return [];
	return readdirSync(workDir)
		.filter((f) => /^TW-\d+-.*\.md$/.test(f))
		.flatMap((file) => {
			const content = readFileSync(join(workDir, file), 'utf8');
			if (!/^status:\s*active\s*$/m.test(content)) return [];
			const idMatch = content.match(/^id:\s*(TW-\d+)/m);
			return [{ file, content, id: idMatch?.[1] ?? file }];
		});
}

function hasPlan(content) {
	const lines = content.split('\n');
	const planIdx = lines.findIndex((l) => /^## Plan\s*$/.test(l));
	if (planIdx === -1) return true; // Pre-TW-052 task; no plan section, don't warn.
	const nextHeader = lines.findIndex((l, i) => i > planIdx && /^## /.test(l));
	const body = lines
		.slice(planIdx + 1, nextHeader === -1 ? undefined : nextHeader)
		.join('\n')
		.replace(/<!--[\s\S]*?-->/g, '')
		.trim();
	return body.length > 0;
}

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
const cutoff = new Date(Date.now() - THREE_DAYS_MS).toISOString().slice(0, 10);

function isStale(content) {
	const m = content.match(/^started:\s*(\d{4}-\d{2}-\d{2})/m);
	return m?.[1] !== undefined && m[1] < cutoff;
}

const lines = ['## Work tracking', ''];
const active = work('list --status active');
if (/^TW-/m.test(active)) {
	lines.push('**Active task(s):**', '```', active, '```', '');
	lines.push(
		'Continue the active task. Read the task file for Context, Scope, Plan, and Acceptance.',
	);

	const activeTasks = readActiveTasks();

	const missingPlan = activeTasks.filter((t) => !hasPlan(t.content)).map((t) => t.id);
	if (missingPlan.length > 0) {
		lines.push('');
		lines.push('**PLAN REQUIRED before writing implementation files.**');
		for (const id of missingPlan) {
			lines.push(`${id} has no ## Plan section.`);
		}
		lines.push('1. Use plan mode with claude-opus-4-8');
		lines.push('2. pnpm run work append-section TW-NNN plan "Chosen approach: ..."');
		lines.push('3. The require-plan hook blocks writes until this is done.');
	}

	const stale = activeTasks.filter((t) => isStale(t.content)).map((t) => t.id);
	if (stale.length > 0) {
		lines.push('');
		lines.push('**STALE ACTIVE TASK(S)** (active >3 days):');
		for (const id of stale) lines.push(`  ${id}`);
		lines.push('Consider completing, blocking, or abandoning before claiming new work.');
		lines.push('Run `pnpm run work stale` for details.');
	}
} else {
	const next = work('next');
	if (/^TW-/m.test(next)) {
		lines.push('**No active task.** Next claimable:', '```', next, '```', '');
		lines.push('Claim with `pnpm run work claim TW-NNN` before implementing.');
	} else {
		lines.push('No claimable backlog task matches the default filter.');
		lines.push('Options:');
		lines.push('  Create new: pnpm run work new --title "..." --type feat --area repo');
		lines.push('  Check blocked: pnpm run work list --status blocked');
		lines.push('  Check all: pnpm run work list --status backlog');
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

#!/usr/bin/env bash
# PreToolUse — block Write/Edit of repo implementation files until an active task with a ## Plan exists.
# Writes outside the repo container (plan-mode plan files, Claude memory, scratchpad), to work/
# ledger files, and to .claude/ agent config are always allowed.
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

# Resolve the repo root from either a worktree cwd (git works) or the
# bare+worktree container cwd (show-toplevel fatals there; fall back to the
# project dir and descend into main/, the canonical worktree).
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [ -z "$ROOT" ]; then ROOT="${CLAUDE_PROJECT_DIR:-$(pwd)}"; fi
if [ ! -d "$ROOT/work" ] && [ -d "$ROOT/main/work" ]; then ROOT="$ROOT/main"; fi

# Enforcement scope is the whole container (every worktree), derived from the
# shared git dir so it is correct from both container and worktree cwds.
SCOPE="$(git rev-parse --path-format=absolute --git-common-dir 2>/dev/null || true)"
if [ -n "$SCOPE" ]; then SCOPE="$(dirname "$SCOPE")"; else SCOPE="${CLAUDE_PROJECT_DIR:-$ROOT}"; fi

cd "$ROOT"

REQUIRE_PLAN_FILE="$file_path" REQUIRE_PLAN_SCOPE="$SCOPE" node <<'NODE'
const { readFileSync, readdirSync, existsSync } = require('node:fs');
const { join, resolve, sep } = require('node:path');

function block(reason) {
	process.stdout.write(JSON.stringify({ decision: 'block', reason }));
	process.exit(0);
}

try {
	const filePath = process.env.REQUIRE_PLAN_FILE || '';
	const scope = process.env.REQUIRE_PLAN_SCOPE || process.cwd();
	const resolved = resolve(process.cwd(), filePath);

	// Outside the repo container — plan files, memory, scratchpad — never block.
	if (resolved !== scope && !resolved.startsWith(scope + sep)) {
		process.exit(0);
	}

	// work/ ledger files (agents fill ## Plan there) and .claude/ agent config
	// are always writable.
	if (/[\\/]work[\\/]/.test(resolved) || /[\\/]\.claude[\\/]/.test(resolved)) {
		process.exit(0);
	}

	const root = process.cwd();
	const workDir = join(root, 'work');

	if (!existsSync(workDir)) {
		process.exit(0);
	}

	const files = readdirSync(workDir).filter((f) => /^TW-\d+-.*\.md$/.test(f));
	const active = [];
	for (const file of files) {
		const content = readFileSync(join(workDir, file), 'utf8');
		if (/^status:\s*active\s*$/m.test(content)) {
			active.push({ file, content });
		}
	}

	if (active.length === 0) {
		block(
			'No active task — claim one before writing implementation files.\n' +
				'  pnpm run work next\n' +
				'  pnpm run work claim TW-NNN',
		);
	}

	// Tasks created before TW-052 have no ## Plan section; treat them as planned.
	function hasPlan(content) {
		const lines = content.split('\n');
		const planIdx = lines.findIndex((l) => /^## Plan\s*$/.test(l));
		if (planIdx === -1) return true;
		const nextHeader = lines.findIndex((l, i) => i > planIdx && /^## /.test(l));
		const body = lines
			.slice(planIdx + 1, nextHeader === -1 ? undefined : nextHeader)
			.join('\n')
			.replace(/<!--[\s\S]*?-->/g, '')
			.trim();
		return body.length > 0;
	}

	// Writes are allowed as long as at least one active task is planned — with
	// several active tasks, the planned one is the one being worked.
	const unplanned = active.filter((t) => !hasPlan(t.content));
	if (unplanned.length === active.length) {
		const ids = active.map(({ file, content }) => {
			const idMatch = content.match(/^id:\s*(TW-\d+)/m);
			return idMatch?.[1] ?? file;
		});
		block(
			`Active task(s) ${ids.join(', ')} have no ## Plan yet — fill one before writing implementation files.\n` +
				'1. Use plan mode (Opus)\n' +
				'2. pnpm run work append-section TW-NNN plan "Chosen approach: ..."\n' +
				'3. This hook will then allow writes.',
		);
	}
} catch {
	// Fail-open: environment issues never block writes.
}
NODE

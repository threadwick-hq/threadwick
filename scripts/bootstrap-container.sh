#!/usr/bin/env bash
# Wires the bare+worktree container so Claude Code sessions started there load
# the repo's agent config. Idempotent; run from anywhere inside the checkout:
#   bash scripts/bootstrap-container.sh
#
# Creates at the container level (one directory above main/):
#   CLAUDE.md              -> main/CLAUDE.container.md
#   AGENTS.md              -> main/AGENTS.md   (keeps @AGENTS.md imports resolvable)
#   .claude/settings.json  -> main/.claude/container/settings.json
set -euo pipefail

MAIN="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONTAINER="$(dirname "$MAIN")"

if [ ! -d "$CONTAINER/.bare" ]; then
	echo "bootstrap-container: $CONTAINER has no .bare dir — not a bare+worktree container; nothing to do." >&2
	exit 0
fi

# Only the canonical main/ checkout may wire the container: running this from a
# task worktree would silently repoint the container symlinks at a directory
# that gets deleted after merge.
if [ "$(basename "$MAIN")" != "main" ]; then
	echo "bootstrap-container: refusing to run from $(basename "$MAIN")/ — run it from the main/ worktree." >&2
	exit 1
fi

link() {
	local target="$1" linkPath="$2"
	if [ -e "$linkPath" ] && [ ! -L "$linkPath" ]; then
		echo "bootstrap-container: $linkPath exists and is not a symlink — leaving it alone." >&2
		return 0
	fi
	ln -sfn "$target" "$linkPath"
	echo "bootstrap-container: $linkPath -> $target"
}

mkdir -p "$CONTAINER/.claude"
link "$MAIN/CLAUDE.container.md" "$CONTAINER/CLAUDE.md"
link "$MAIN/AGENTS.md" "$CONTAINER/AGENTS.md"
link "$MAIN/.claude/container/settings.json" "$CONTAINER/.claude/settings.json"

# Single-source the permissions allowlist: the worktree settings
# (.claude/settings.json) is the authored list; the container settings source
# derives its copy here. scripts/settings-allowlist-parity.test.ts fails CI
# when the two drift (i.e. someone edits one without re-running bootstrap).
node - "$MAIN" <<'NODE'
const { readFileSync, writeFileSync } = require('node:fs');
const main = process.argv[2];
const authoredPath = `${main}/.claude/settings.json`;
const derivedPath = `${main}/.claude/container/settings.json`;
const authored = JSON.parse(readFileSync(authoredPath, 'utf8'));
const derived = JSON.parse(readFileSync(derivedPath, 'utf8'));
const allow = authored?.permissions?.allow;
if (!Array.isArray(allow)) {
	console.error('bootstrap-container: no permissions.allow in .claude/settings.json — skipping allowlist sync.');
	process.exit(0);
}
const before = JSON.stringify(derived.permissions?.allow);
derived.permissions = { ...derived.permissions, allow };
if (JSON.stringify(allow) === before) {
	console.log('bootstrap-container: container allowlist already in sync.');
	process.exit(0);
}
writeFileSync(derivedPath, `${JSON.stringify(derived, null, '\t')}\n`);
console.log(`bootstrap-container: synced permissions.allow (${allow.length} entries) into .claude/container/settings.json`);
NODE

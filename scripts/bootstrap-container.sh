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

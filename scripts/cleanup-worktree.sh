#!/usr/bin/env bash
# Post-merge cleanup: removes the linked worktree directory and local branch for a task.
# Usage: bash scripts/cleanup-worktree.sh <issue-number|TW-NNN>  (run from inside any worktree, e.g. main/)
set -euo pipefail

TASK_ID="${1:?Usage: cleanup-worktree.sh <issue-number|TW-NNN>}"
echo "$TASK_ID" | grep -qE '^(TW-)?[0-9]+$' || {
	echo "error: expected an issue number (e.g. 103) or legacy TW-NNN id"
	exit 1
}

ROOT="$(git rev-parse --show-toplevel)"
PARENT="$(dirname "$ROOT")"
WORKTREE_PATH="$PARENT/$TASK_ID"

if [ -d "$WORKTREE_PATH" ]; then
	git worktree remove --force "$WORKTREE_PATH"
	echo "removed worktree $WORKTREE_PATH"
else
	echo "no worktree at $WORKTREE_PATH (already removed?)"
fi

BRANCH="$(git branch --list "feat/${TASK_ID}-*" | head -1 | tr -d ' *')"
if [ -n "$BRANCH" ]; then
	git branch -d "$BRANCH" 2>/dev/null || git branch -D "$BRANCH"
	echo "deleted branch $BRANCH"
else
	echo "no local branch matching feat/${TASK_ID}-* (already deleted?)"
fi

echo "done."

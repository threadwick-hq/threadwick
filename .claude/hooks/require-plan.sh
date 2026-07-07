#!/usr/bin/env bash
# PreToolUse entry point — thin shim; the logic lives in require-plan.mjs
# (shared helpers in lib/). The hook payload flows through on stdin.
# Kept as .sh so settings.json wiring stays stable.
set -euo pipefail
HOOK_SELF="$(command -v realpath >/dev/null 2>&1 && realpath "$0" || echo "$0")"
exec node "$(cd "$(dirname "$HOOK_SELF")" && pwd)/require-plan.mjs"

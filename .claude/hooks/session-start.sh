#!/usr/bin/env bash
# SessionStart entry point — thin shim; the logic lives in session-start.mjs
# (shared helpers in lib/). Kept as .sh so settings.json wiring stays stable.
set -euo pipefail
HOOK_SELF="$(command -v realpath >/dev/null 2>&1 && realpath "$0" || echo "$0")"
exec node "$(cd "$(dirname "$HOOK_SELF")" && pwd)/session-start.mjs"

#!/usr/bin/env bash
# SessionStart entry point — thin shim; the logic lives in session-start.mjs
# (shared helpers in lib/). Kept as .sh so settings.json wiring stays stable.
set -euo pipefail
exec node "$(cd "$(dirname "$0")" && pwd)/session-start.mjs"

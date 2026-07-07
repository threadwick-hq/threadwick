#!/usr/bin/env bash
# PreToolUse entry point — thin shim; the logic lives in require-plan.mjs
# (shared helpers in lib/). The hook payload flows through on stdin.
# Kept as .sh so settings.json wiring stays stable.
set -euo pipefail
exec node "$(cd "$(dirname "$0")" && pwd)/require-plan.mjs"

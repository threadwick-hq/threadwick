#!/usr/bin/env bash
# sessionStart — inject active/next work task context for Cursor agents.
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"

WORK="pnpm exec tsx scripts/work.ts"

context="## Work tracking\n\n"

active="$($WORK list --status active 2>/dev/null || true)"
if echo "$active" | grep -q '^TW-'; then
  context+="**Active task(s):**\n\`\`\`\n${active}\n\`\`\`\n\n"
  context+="Continue the active task before claiming new work. Read the task file for Context/Scope/Acceptance.\n"
else
  next="$($WORK next 2>/dev/null || true)"
  if echo "$next" | grep -q '^TW-'; then
    context+="**No active task.** Next claimable:\n\`\`\`\n${next}\n\`\`\`\n\n"
    context+="Claim with \`pnpm run work claim TW-NNN\` before implementing.\n"
  else
    context+="No claimable backlog task matches the default filter.\n"
  fi
fi

context+="\nSee \`AGENTS.md\`, \`work/README.md\`, and \`.cursor/rules/\`."

# additional_context may be dropped by a known Cursor bug; env vars persist for hooks.
node -e "
console.log(JSON.stringify({
  env: { THREADWICK_WORK_ROOT: process.argv[1] },
  additional_context: process.argv[2],
}));
" "$ROOT" "$context"

#!/usr/bin/env bash
# afterFileEdit — regenerate work/INDEX.md when a task file frontmatter changes.
set -euo pipefail

input="$(cat)"
file_path="$(node -e "
  const j = JSON.parse(process.argv[1]);
  process.stdout.write(j.file_path || j.path || '');
" "$input")"

if [[ ! "$file_path" =~ work/TW-[0-9]+-.+\.md$ ]]; then
  exit 0
fi

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"

if pnpm exec tsx scripts/work.ts index >/dev/null 2>&1; then
  printf '{"additional_context":"Regenerated work/INDEX.md after edit to %s."}\n' "$file_path"
fi

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

index_output=""
index_status=0
index_output="$(pnpm exec tsx scripts/work.ts index 2>&1)" || index_status=$?

node -e "
const file = process.argv[1];
const ok = process.argv[2] === '0';
const detail = process.argv[3] || '';
const msg = ok
  ? \`Regenerated work/INDEX.md after edit to \${file}.\`
  : \`Could not regenerate work/INDEX.md after edit to \${file}. Run \\\`pnpm run work check\\\` then \\\`pnpm run work index\\\` manually.\\\n\\\n\${detail.trim()}\`;
console.log(JSON.stringify({ additional_context: msg }));
" "$file_path" "$index_status" "$index_output"

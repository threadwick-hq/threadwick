#!/usr/bin/env bash
# PostToolUse (Write|Edit) — regenerate work/INDEX.md when a task file changes.
set -euo pipefail

input="$(cat)"
# Read the payload via stdin (not argv) so large Write/Edit contents can't blow
# ARG_MAX, and tolerate a missing/malformed payload without aborting the hook.
file_path="$(printf '%s' "$input" | node -e '
	const fs = require("node:fs");
	let raw = "";
	try { raw = fs.readFileSync(0, "utf8"); } catch {}
	let p = "";
	try { p = (JSON.parse(raw).tool_input || {}).file_path || ""; } catch {}
	process.stdout.write(p);
')"

if [[ ! "$file_path" =~ work/TW-[0-9]+-.+\.md$ ]]; then
	exit 0
fi

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"

index_output=""
index_status=0
index_output="$(pnpm exec tsx scripts/work.ts index 2>&1)" || index_status=$?

# Values pass via env (small) and the JS is a quoted heredoc, so there is no
# backslash-escaping to get wrong in the message.
INDEX_FILE="$file_path" INDEX_OK="$index_status" INDEX_DETAIL="$index_output" node <<'NODE'
const file = process.env.INDEX_FILE || '';
const ok = process.env.INDEX_OK === '0';
const detail = (process.env.INDEX_DETAIL || '').trim();
const msg = ok
	? `Regenerated work/INDEX.md after edit to ${file}.`
	: `Could not regenerate work/INDEX.md after edit to ${file}. Run \`pnpm run work check\` then \`pnpm run work index\` manually.\n\n${detail}`;
console.log(
	JSON.stringify({
		hookSpecificOutput: {
			hookEventName: 'PostToolUse',
			additionalContext: msg,
		},
	}),
);
NODE

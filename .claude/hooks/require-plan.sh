#!/usr/bin/env bash
# PreToolUse — block Write/Edit of non-work files until an active task with a ## Plan exists.
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"

node <<'NODE'
const { readFileSync, readdirSync, existsSync } = require('node:fs');
const { join } = require('node:path');

function block(reason) {
	process.stdout.write(JSON.stringify({ decision: 'block', reason }));
	process.exit(0);
}

try {
	const stdin = readFileSync('/dev/stdin', 'utf8');
	const payload = JSON.parse(stdin);
	const filePath = payload?.tool_input?.file_path ?? '';

	// Always allow writes to work/ files — agents fill ## Plan there.
	if (/\/work\//.test(filePath)) {
		process.exit(0);
	}

	const root = process.cwd();
	const workDir = join(root, 'work');

	if (!existsSync(workDir)) {
		process.exit(0);
	}

	const files = readdirSync(workDir).filter((f) => /^TW-\d+-.*\.md$/.test(f));
	const active = [];
	for (const file of files) {
		const content = readFileSync(join(workDir, file), 'utf8');
		if (/^status:\s*active\s*$/m.test(content)) {
			active.push({ file, content });
		}
	}

	if (active.length === 0) {
		block(
			'No active task — claim one before writing implementation files.\n' +
				'  pnpm run work next\n' +
				'  pnpm run work claim TW-NNN',
		);
	}

	const { file, content } = active[0];
	const idMatch = content.match(/^id:\s*(TW-\d+)/m);
	const taskId = idMatch?.[1] ?? file;

	const lines = content.split('\n');
	const planIdx = lines.findIndex((l) => /^## Plan\s*$/.test(l));

	// Tasks created before TW-052 have no ## Plan section; allow them through.
	if (planIdx === -1) {
		process.exit(0);
	}

	const nextHeader = lines.findIndex((l, i) => i > planIdx && /^## /.test(l));
	const planContent = lines
		.slice(planIdx + 1, nextHeader === -1 ? undefined : nextHeader)
		.join('\n')
		.replace(/<!--[\s\S]*?-->/g, '')
		.trim();

	if (!planContent) {
		block(
			`${taskId} has no ## Plan yet — fill it before writing implementation files.\n` +
				'1. Use plan mode with claude-opus-4-8\n' +
				`2. pnpm run work append-section ${taskId} plan "Chosen approach: ..."\n` +
				'3. This hook will then allow writes.',
		);
	}
} catch {
	// Fail-open: environment issues never block writes.
}
NODE

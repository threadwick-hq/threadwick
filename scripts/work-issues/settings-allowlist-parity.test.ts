import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

type SettingsFile = { permissions?: { allow?: readonly string[] } };

function readAllowlist(relativePath: string): readonly string[] {
	const raw = readFileSync(resolve(__dirname, '..', '..', relativePath), 'utf8');
	const parsed: unknown = JSON.parse(raw);
	const allow = (parsed as SettingsFile).permissions?.allow;
	if (!Array.isArray(allow)) {
		throw new Error(`${relativePath} has no permissions.allow array`);
	}
	return allow;
}

/**
 * The worktree settings file is the authored allowlist; the container settings
 * source derives its copy via scripts/bootstrap-container.sh. Editing one
 * without re-running bootstrap must not merge.
 */
describe('permissions allowlist single-sourcing', () => {
	it('container settings carry the exact authored allowlist', () => {
		expect(readAllowlist('.claude/container/settings.json')).toEqual(
			readAllowlist('.claude/settings.json'),
		);
	});
});

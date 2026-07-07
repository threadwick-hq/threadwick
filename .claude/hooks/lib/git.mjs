// Shared git-dir resolution for the workflow hooks: resolves the bare+worktree
// container's shared git dir from a worktree cwd, or descends into main/ when
// run at the container root (plain git fatals there).
import { execFileSync } from 'node:child_process';

/** Absolute path of the shared git common dir, or undefined outside a repo. */
export function resolveGitCommonDir({
	cwd = process.cwd(),
	env = process.env,
} = {}) {
	const direct = revParseCommonDir(cwd);
	if (direct !== undefined) return direct;
	const base = env.CLAUDE_PROJECT_DIR ?? cwd;
	return revParseCommonDir(`${base}/main`);
}

/** Path to the shared work cache, or undefined outside a repo. */
export function resolveWorkCachePath(options) {
	const commonDir = resolveGitCommonDir(options);
	return commonDir === undefined ? undefined : `${commonDir}/work-cache.json`;
}

function revParseCommonDir(dir) {
	try {
		const out = execFileSync(
			'git',
			['-C', dir, 'rev-parse', '--path-format=absolute', '--git-common-dir'],
			{ encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
		).trim();
		return out.length > 0 ? out : undefined;
	} catch {
		return undefined;
	}
}

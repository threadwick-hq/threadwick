/**
 * The shared local snapshot cache.
 *
 * Lives inside the common git dir so every linked worktree sees the same file
 * and it can never be committed. The cache is never authoritative: it exists
 * so hooks and offline reads avoid network calls. Only trust-filtered content
 * is ever written to it.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { CACHE_FILE_NAME } from './config';
import { isRecord } from './json';
import type { InboxComment, Result, WorkCache, WorkSnapshot } from './types';

export function cacheFilePath(): Result<string> {
	try {
		const commonDir = execFileSync(
			'git',
			['rev-parse', '--path-format=absolute', '--git-common-dir'],
			{ encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 10_000 },
		).trim();
		return { ok: true, value: join(commonDir, CACHE_FILE_NAME) };
	} catch {
		return { ok: false, error: 'not inside a git repository' };
	}
}

export function readCache(): Result<WorkCache> {
	const path = cacheFilePath();
	if (!path.ok) return path;
	let raw: string;
	try {
		raw = readFileSync(path.value, 'utf8');
	} catch {
		return { ok: false, error: `no cache at ${path.value}` };
	}
	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch {
		return { ok: false, error: 'cache file is not valid JSON' };
	}
	if (!isWorkCache(parsed)) {
		return { ok: false, error: 'cache file has an unexpected shape' };
	}
	return { ok: true, value: parsed };
}

export function writeCache(cache: WorkCache): Result<undefined> {
	const path = cacheFilePath();
	if (!path.ok) return path;
	try {
		// Write-then-rename: the cache is shared across worktrees and read by
		// hooks, so a concurrent reader must never observe a torn file.
		const tempPath = `${path.value}.tmp-${process.pid}`;
		writeFileSync(tempPath, `${JSON.stringify(cache, null, '\t')}\n`, 'utf8');
		renameSync(tempPath, path.value);
		return { ok: true, value: undefined };
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		return { ok: false, error: `cannot write cache: ${message}` };
	}
}

/** Builds the next cache from a fresh snapshot, keeping existing cursors. */
export function nextCache(
	snapshot: WorkSnapshot,
	previous: WorkCache | undefined,
): WorkCache {
	return {
		version: 1,
		snapshot,
		cursors: previous?.cursors ?? {},
	};
}

/** Comments strictly newer than the cursor (all of them when no cursor). */
export function commentsSince(
	comments: readonly InboxComment[],
	cursor: string | undefined,
): InboxComment[] {
	if (cursor === undefined) return [...comments];
	return comments.filter((comment) => comment.createdAt > cursor);
}

/** The cursor value that marks every listed comment as seen. */
export function latestTimestamp(
	comments: readonly InboxComment[],
): string | undefined {
	return comments.reduce<string | undefined>(
		(latest, comment) =>
			latest === undefined || comment.createdAt > latest
				? comment.createdAt
				: latest,
		undefined,
	);
}

/**
 * Shape check for a cache read from disk. Verifies the envelope and leaves
 * issue-level details to the writer, which is always this same module.
 */
function isWorkCache(value: unknown): value is WorkCache {
	if (!isRecord(value)) return false;
	if (value.version !== 1) return false;
	if (!isRecord(value.snapshot)) return false;
	if (!isRecord(value.cursors)) return false;
	const snapshot = value.snapshot;
	return (
		typeof snapshot.fetchedAt === 'string' &&
		typeof snapshot.repo === 'string' &&
		Array.isArray(snapshot.issues)
	);
}

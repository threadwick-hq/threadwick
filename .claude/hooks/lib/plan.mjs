// Shared work-cache helpers for the workflow hooks (session-start, require-plan,
// pre-push). One implementation replaces the three hand-copied heredoc versions.
//
// planFilled mirrors the TypeScript canonical `isPlanFilled` in
// scripts/work-issues/body.ts on work:v1-shaped bodies; it is deliberately more
// lenient on marker-less bodies (line scan, no marker requirement) because hooks
// must fail open. scripts/work-issues/plan-parity.test.ts holds the two in lockstep.
import { readFileSync } from 'node:fs';

/** A plan counts as filled once its section is non-empty and no longer the placeholder. */
export function planFilled(body) {
	const lines = String(body ?? '').split('\n');
	const start = lines.findIndex((line) => /^## Plan\s*$/.test(line));
	if (start === -1) return false;
	const end = lines.findIndex((line, i) => i > start && /^## /.test(line));
	const section = lines
		.slice(start + 1, end === -1 ? undefined : end)
		.join('\n')
		.trim();
	return section.length > 0 && !section.startsWith('_Filled');
}

/** Parses the shared work cache; undefined when the path is missing or unreadable. */
export function readWorkCache(cachePath) {
	try {
		return JSON.parse(readFileSync(cachePath ?? '', 'utf8'));
	} catch {
		return undefined;
	}
}

/** Open issues assigned to the cache viewer. */
export function activeIssues(cache) {
	const snapshot = cache?.snapshot ?? {};
	const issues = Array.isArray(snapshot.issues) ? snapshot.issues : [];
	const viewer = snapshot.viewerLogin ?? '';
	return issues.filter(
		(issue) =>
			issue.state === 'OPEN' &&
			Array.isArray(issue.assignees) &&
			issue.assignees.includes(viewer),
	);
}

/** Active issues whose Plan section is still unfilled. */
export function unplannedIssues(active) {
	return active.filter((issue) => !planFilled(issue.body));
}

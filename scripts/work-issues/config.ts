/** Repo-specific constants for the issue-first work CLI. */

import type { Priority, WorkType } from './types';

export const REPO_OWNER = 'threadwick-hq';
export const REPO_NAME = 'threadwick';
export const REPO = `${REPO_OWNER}/${REPO_NAME}`;

export const PROJECT_TITLE = 'Threadwick Work';
export const PRIORITY_FIELD_NAME = 'Priority';

export const PRIORITIES: readonly Priority[] = ['p0', 'p1', 'p2', 'p3'];
export const DEFAULT_PRIORITY: Priority = 'p2';

/** Maps the work type vocabulary to native org issue type names. */
export const ISSUE_TYPE_BY_WORK_TYPE: Record<WorkType, string> = {
	feat: 'Feature',
	fix: 'Bug',
	refactor: 'Refactor',
	chore: 'Chore',
	docs: 'Docs',
	test: 'Test',
};

export const WORK_TYPES = Object.keys(ISSUE_TYPE_BY_WORK_TYPE);

export const AREAS = [
	'apps/studio',
	'apps/web',
	'packages/config',
	'packages/core',
	'packages/editor',
	'packages/i18n',
	'packages/icons',
	'packages/org',
	'packages/types',
	'repo',
] as const;

export const AREA_LABEL_PREFIX = 'area:';
export const MAX_PHASE = 8;
export const CACHE_FILE_NAME = 'work-cache.json';

export function milestoneTitleForPhase(phase: number): string {
	return `Phase ${phase}`;
}

export function phaseFromMilestoneTitle(title: string): number | undefined {
	const match = /^Phase (\d+)$/.exec(title);
	if (match?.[1] === undefined) return undefined;
	const phase = Number.parseInt(match[1], 10);
	return Number.isInteger(phase) && phase >= 0 && phase <= MAX_PHASE
		? phase
		: undefined;
}

export function areaLabel(area: string): string {
	return `${AREA_LABEL_PREFIX}${area}`;
}

export function workTypeFromIssueType(
	issueTypeName: string,
): WorkType | undefined {
	const entries = Object.entries(ISSUE_TYPE_BY_WORK_TYPE);
	const found = entries.find(([, native]) => native === issueTypeName);
	return found === undefined ? undefined : parseWorkType(found[0]);
}

export function parseWorkType(value: string): WorkType | undefined {
	return value === 'feat' ||
		value === 'fix' ||
		value === 'refactor' ||
		value === 'chore' ||
		value === 'docs' ||
		value === 'test'
		? value
		: undefined;
}

export function parsePriority(value: string): Priority | undefined {
	return value === 'p0' || value === 'p1' || value === 'p2' || value === 'p3'
		? value
		: undefined;
}

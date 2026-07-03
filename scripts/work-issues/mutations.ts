/**
 * Write side of the GitHub integration: issue mutations and the idempotent
 * bootstrap primitives (labels, milestones, org issue types, project board).
 * Every function takes the GhRunner so tests can stub IO.
 */

import {
	AREAS,
	areaLabel,
	ISSUE_TYPE_BY_WORK_TYPE,
	MAX_PHASE,
	milestoneTitleForPhase,
	PRIORITIES,
	PRIORITY_FIELD_NAME,
	PROJECT_TITLE,
	REPO,
	REPO_OWNER,
} from './config';
import type { GhRunner } from './gh';
import { ghFailureHint } from './gh';
import {
	getArray,
	getNumber,
	getString,
	isRecord,
	parseJson,
	recordEntries,
} from './json';
import type { Priority, Result, WorkType } from './types';

export type CreatedIssue = { number: number; url: string };

export type ProjectRef = { number: number; id: string };

export type PriorityField = {
	fieldId: string;
	optionIds: Record<string, string>;
};

export type BootstrapReport = {
	lines: string[];
	issueTypesAvailable: boolean;
	dependenciesAvailable: boolean;
	project: ProjectRef | undefined;
};

/** GitHub's issue-type color palette (REST enum, lowercase), by work type. */
const ISSUE_TYPE_COLORS: Record<WorkType, string> = {
	feat: 'blue',
	fix: 'red',
	refactor: 'purple',
	chore: 'gray',
	docs: 'green',
	test: 'orange',
};

// --- Issue mutations ---

export function createIssue(
	run: GhRunner,
	input: {
		title: string;
		body: string;
		labels: string[];
		milestoneNumber: number | undefined;
	},
): Result<CreatedIssue> {
	const payload: Record<string, unknown> = {
		title: input.title,
		body: input.body,
		labels: input.labels,
	};
	if (input.milestoneNumber !== undefined) {
		payload.milestone = input.milestoneNumber;
	}
	const result = apiJson(run, 'POST', `repos/${REPO}/issues`, payload);
	if (!result.ok) return result;
	const number = getNumber(result.value, 'number');
	const url = getString(result.value, 'html_url');
	if (number === undefined || url === undefined) {
		return { ok: false, error: 'issue created but response was unreadable' };
	}
	return { ok: true, value: { number, url } };
}

export function updateIssueBody(
	run: GhRunner,
	number: number,
	body: string,
): Result<undefined> {
	const result = apiJson(run, 'PATCH', `repos/${REPO}/issues/${number}`, {
		body,
	});
	return result.ok ? { ok: true, value: undefined } : result;
}

export function setIssueType(
	run: GhRunner,
	number: number,
	workType: WorkType,
): Result<undefined> {
	const result = apiJson(run, 'PATCH', `repos/${REPO}/issues/${number}`, {
		type: ISSUE_TYPE_BY_WORK_TYPE[workType],
	});
	return result.ok ? { ok: true, value: undefined } : result;
}

export function addAssignee(
	run: GhRunner,
	number: number,
	login: string,
): Result<undefined> {
	const result = apiJson(
		run,
		'POST',
		`repos/${REPO}/issues/${number}/assignees`,
		{ assignees: [login] },
	);
	return result.ok ? { ok: true, value: undefined } : result;
}

export function addComment(
	run: GhRunner,
	number: number,
	body: string,
): Result<string> {
	const result = apiJson(
		run,
		'POST',
		`repos/${REPO}/issues/${number}/comments`,
		{ body },
	);
	if (!result.ok) return result;
	const url = getString(result.value, 'html_url');
	return { ok: true, value: url ?? '' };
}

export function addLabels(
	run: GhRunner,
	number: number,
	labels: string[],
): Result<undefined> {
	const result = apiJson(run, 'POST', `repos/${REPO}/issues/${number}/labels`, {
		labels,
	});
	return result.ok ? { ok: true, value: undefined } : result;
}

export function removeLabel(
	run: GhRunner,
	number: number,
	label: string,
): Result<undefined> {
	const result = run([
		'api',
		'-X',
		'DELETE',
		`repos/${REPO}/issues/${number}/labels/${encodeURIComponent(label)}`,
	]);
	return result.ok
		? { ok: true, value: undefined }
		: { ok: false, error: ghFailureHint(result.error) };
}

// --- Dependencies (native blocked-by) ---

/** Looks up the REST database id needed by the dependencies endpoints. */
export function issueDatabaseId(run: GhRunner, number: number): Result<number> {
	const result = run(['api', `repos/${REPO}/issues/${number}`, '--jq', '.id']);
	if (!result.ok) return { ok: false, error: ghFailureHint(result.error) };
	const id = Number.parseInt(result.value.trim(), 10);
	return Number.isSafeInteger(id)
		? { ok: true, value: id }
		: { ok: false, error: `could not resolve database id for #${number}` };
}

export function addBlockedBy(
	run: GhRunner,
	number: number,
	blockerNumber: number,
): Result<undefined> {
	const blockerId = issueDatabaseId(run, blockerNumber);
	if (!blockerId.ok) return blockerId;
	const result = apiJson(
		run,
		'POST',
		`repos/${REPO}/issues/${number}/dependencies/blocked_by`,
		// biome-ignore lint/style/useNamingConvention: GitHub API wire format
		{ issue_id: blockerId.value },
	);
	return result.ok ? { ok: true, value: undefined } : result;
}

export function removeBlockedBy(
	run: GhRunner,
	number: number,
	blockerNumber: number,
): Result<undefined> {
	const blockerId = issueDatabaseId(run, blockerNumber);
	if (!blockerId.ok) return blockerId;
	const result = run([
		'api',
		'-X',
		'DELETE',
		`repos/${REPO}/issues/${number}/dependencies/blocked_by/${blockerId.value}`,
	]);
	return result.ok
		? { ok: true, value: undefined }
		: { ok: false, error: ghFailureHint(result.error) };
}

// --- Milestones ---

export function milestoneNumberForPhase(
	run: GhRunner,
	phase: number,
): Result<number> {
	const result = run([
		'api',
		`repos/${REPO}/milestones?state=all&per_page=100`,
	]);
	if (!result.ok) return { ok: false, error: ghFailureHint(result.error) };
	const parsed = parseJson(result.value);
	const milestones = Array.isArray(parsed) ? recordEntries(parsed) : [];
	const wanted = milestoneTitleForPhase(phase);
	const milestone = milestones.find(
		(candidate) => getString(candidate, 'title') === wanted,
	);
	const number =
		milestone === undefined ? undefined : getNumber(milestone, 'number');
	return number === undefined
		? { ok: false, error: `milestone "${wanted}" not found (run bootstrap)` }
		: { ok: true, value: number };
}

// --- Project (priority field) ---

export function resolveProject(run: GhRunner): Result<ProjectRef> {
	const result = run([
		'project',
		'list',
		'--owner',
		REPO_OWNER,
		'--limit',
		'100',
		'--format',
		'json',
	]);
	if (!result.ok) return { ok: false, error: ghFailureHint(result.error) };
	const parsed = parseJson(result.value);
	if (!isRecord(parsed)) {
		return { ok: false, error: 'project list output was not JSON' };
	}
	const project = recordEntries(getArray(parsed, 'projects')).find(
		(candidate) => getString(candidate, 'title') === PROJECT_TITLE,
	);
	if (project === undefined) {
		return {
			ok: false,
			error: `project "${PROJECT_TITLE}" not found (run bootstrap)`,
		};
	}
	const number = getNumber(project, 'number');
	const id = getString(project, 'id');
	return number === undefined || id === undefined
		? { ok: false, error: 'project entry was unreadable' }
		: { ok: true, value: { number, id } };
}

export function resolvePriorityField(
	run: GhRunner,
	project: ProjectRef,
): Result<PriorityField> {
	const result = run([
		'project',
		'field-list',
		String(project.number),
		'--owner',
		REPO_OWNER,
		'--limit',
		'100',
		'--format',
		'json',
	]);
	if (!result.ok) return { ok: false, error: ghFailureHint(result.error) };
	const parsed = parseJson(result.value);
	if (!isRecord(parsed)) {
		return { ok: false, error: 'field list output was not JSON' };
	}
	const field = recordEntries(getArray(parsed, 'fields')).find(
		(candidate) => getString(candidate, 'name') === PRIORITY_FIELD_NAME,
	);
	if (field === undefined) {
		return {
			ok: false,
			error: `field "${PRIORITY_FIELD_NAME}" not found (run bootstrap)`,
		};
	}
	const fieldId = getString(field, 'id');
	if (fieldId === undefined) {
		return { ok: false, error: 'priority field id was unreadable' };
	}
	const optionIds: Record<string, string> = {};
	for (const option of recordEntries(getArray(field, 'options'))) {
		const name = getString(option, 'name');
		const id = getString(option, 'id');
		if (name !== undefined && id !== undefined) optionIds[name] = id;
	}
	return { ok: true, value: { fieldId, optionIds } };
}

/** Adds the issue to the project (idempotent) and sets its Priority option. */
export function setIssuePriority(
	run: GhRunner,
	project: ProjectRef,
	field: PriorityField,
	issueUrl: string,
	priority: Priority,
): Result<undefined> {
	const optionId = field.optionIds[priority];
	if (optionId === undefined) {
		return { ok: false, error: `priority option "${priority}" not found` };
	}
	const added = run([
		'project',
		'item-add',
		String(project.number),
		'--owner',
		REPO_OWNER,
		'--url',
		issueUrl,
		'--format',
		'json',
	]);
	if (!added.ok) return { ok: false, error: ghFailureHint(added.error) };
	const parsed = parseJson(added.value);
	const itemId = isRecord(parsed) ? getString(parsed, 'id') : undefined;
	if (itemId === undefined) {
		return { ok: false, error: 'project item id was unreadable' };
	}
	const edited = run([
		'project',
		'item-edit',
		'--id',
		itemId,
		'--project-id',
		project.id,
		'--field-id',
		field.fieldId,
		'--single-select-option-id',
		optionId,
	]);
	return edited.ok
		? { ok: true, value: undefined }
		: { ok: false, error: ghFailureHint(edited.error) };
}

// --- Bootstrap primitives ---

export function ensureAreaLabels(run: GhRunner): Result<string[]> {
	const existing = run([
		'api',
		`repos/${REPO}/labels?per_page=100`,
		'--paginate',
		'--jq',
		'.[].name',
	]);
	if (!existing.ok) return { ok: false, error: ghFailureHint(existing.error) };
	const have = new Set(existing.value.split('\n').map((line) => line.trim()));
	const lines: string[] = [];
	for (const area of AREAS) {
		const label = areaLabel(area);
		if (have.has(label)) {
			lines.push(`label ${label}: exists`);
			continue;
		}
		const created = apiJson(run, 'POST', `repos/${REPO}/labels`, {
			name: label,
			color: '1d76db',
			description: `Work area: ${area}`,
		});
		lines.push(
			created.ok
				? `label ${label}: created`
				: `label ${label}: FAILED (${created.error})`,
		);
	}
	return { ok: true, value: lines };
}

export function ensureMilestones(run: GhRunner): Result<string[]> {
	const existing = run([
		'api',
		`repos/${REPO}/milestones?state=all&per_page=100`,
		'--jq',
		'.[].title',
	]);
	if (!existing.ok) return { ok: false, error: ghFailureHint(existing.error) };
	const have = new Set(existing.value.split('\n').map((line) => line.trim()));
	const lines: string[] = [];
	for (let phase = 0; phase <= MAX_PHASE; phase += 1) {
		const title = milestoneTitleForPhase(phase);
		if (have.has(title)) {
			lines.push(`milestone ${title}: exists`);
			continue;
		}
		const created = apiJson(run, 'POST', `repos/${REPO}/milestones`, {
			title,
			description: `MIGRATION.md phase ${phase}`,
		});
		lines.push(
			created.ok
				? `milestone ${title}: created`
				: `milestone ${title}: FAILED (${created.error})`,
		);
	}
	return { ok: true, value: lines };
}

/**
 * Ensures the org issue types exist. Returns available=false (with manual
 * steps in the lines) when the API is absent on this plan.
 */
export function ensureIssueTypes(run: GhRunner): {
	available: boolean;
	lines: string[];
} {
	const existing = run(['api', `orgs/${REPO_OWNER}/issue-types`]);
	if (!existing.ok) {
		return {
			available: false,
			lines: [
				`issue types: API unavailable (${ghFailureHint(existing.error)})`,
				`  manual step: org Settings > Planning > Issue types, add: ${Object.values(ISSUE_TYPE_BY_WORK_TYPE).join(', ')}`,
			],
		};
	}
	const parsed = parseJson(existing.value);
	const have = new Set(
		(Array.isArray(parsed) ? recordEntries(parsed) : [])
			.map((entry) => getString(entry, 'name'))
			.filter((name): name is string => name !== undefined),
	);
	const lines: string[] = [];
	let available = true;
	for (const [workType, name] of typedTypeEntries()) {
		if (have.has(name)) {
			lines.push(`issue type ${name}: exists`);
			continue;
		}
		const created = apiJson(run, 'POST', `orgs/${REPO_OWNER}/issue-types`, {
			name,
			description: `Work type: ${name}`,
			// biome-ignore lint/style/useNamingConvention: GitHub API wire format
			is_enabled: true,
			color: ISSUE_TYPE_COLORS[workType],
		});
		if (created.ok) {
			lines.push(`issue type ${name}: created`);
		} else {
			available = false;
			lines.push(`issue type ${name}: FAILED (${created.error})`);
			lines.push(
				`  manual step: org Settings > Planning > Issue types, add "${name}"`,
			);
		}
	}
	return { available, lines };
}

export function ensureProject(run: GhRunner): Result<ProjectRef> {
	const existing = resolveProject(run);
	if (existing.ok) return existing;
	const created = run([
		'project',
		'create',
		'--owner',
		REPO_OWNER,
		'--title',
		PROJECT_TITLE,
		'--format',
		'json',
	]);
	if (!created.ok) return { ok: false, error: ghFailureHint(created.error) };
	const linkResult = resolveProject(run);
	if (!linkResult.ok) return linkResult;
	// Linking the project to the repo is cosmetic (repo sidebar); best effort.
	run([
		'project',
		'link',
		String(linkResult.value.number),
		'--owner',
		REPO_OWNER,
		'--repo',
		REPO,
	]);
	return linkResult;
}

export function ensurePriorityField(
	run: GhRunner,
	project: ProjectRef,
): Result<PriorityField> {
	const existing = resolvePriorityField(run, project);
	if (existing.ok) return existing;
	const created = run([
		'project',
		'field-create',
		String(project.number),
		'--owner',
		REPO_OWNER,
		'--name',
		PRIORITY_FIELD_NAME,
		'--data-type',
		'SINGLE_SELECT',
		'--single-select-options',
		PRIORITIES.join(','),
	]);
	if (!created.ok) return { ok: false, error: ghFailureHint(created.error) };
	return resolvePriorityField(run, project);
}

/** Probes the dependencies REST endpoint against one existing issue. */
export function probeDependencies(
	run: GhRunner,
	sampleIssueNumber: number | undefined,
): { available: boolean; line: string } {
	if (sampleIssueNumber === undefined) {
		return {
			available: false,
			line: 'dependencies: no issue to probe against yet (re-run after first issue)',
		};
	}
	const result = run([
		'api',
		`repos/${REPO}/issues/${sampleIssueNumber}/dependencies/blocked_by?per_page=1`,
	]);
	if (result.ok) {
		return {
			available: true,
			line: 'dependencies: native blocked-by API available',
		};
	}
	return {
		available: false,
		line: `dependencies: API unavailable, falling back to the "blocked" label (${ghFailureHint(result.error)})`,
	};
}

// --- Helpers ---

/** Work-type/native-name pairs with the key statically typed. */
function typedTypeEntries(): [WorkType, string][] {
	const workTypes: WorkType[] = [
		'feat',
		'fix',
		'refactor',
		'chore',
		'docs',
		'test',
	];
	return workTypes.map((workType) => [
		workType,
		ISSUE_TYPE_BY_WORK_TYPE[workType],
	]);
}

/** Runs a gh api call with a JSON body and parses the JSON response. */
function apiJson(
	run: GhRunner,
	method: 'POST' | 'PATCH',
	path: string,
	payload: Record<string, unknown>,
): Result<Record<string, unknown>> {
	const result = run(
		['api', '-X', method, path, '--input', '-'],
		JSON.stringify(payload),
	);
	if (!result.ok) return { ok: false, error: ghFailureHint(result.error) };
	const parsed = parseJson(result.value);
	return isRecord(parsed)
		? { ok: true, value: parsed }
		: { ok: true, value: {} };
}

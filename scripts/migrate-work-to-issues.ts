/**
 * migrate-work-to-issues.ts — one-off TW-055 migration (kept as a record).
 *
 * Retrofits the mirror-created GitHub issues into first-class work issues:
 * work:v1 bodies rendered from the work/ ledger, area labels (replacing the
 * mirror labels), phase milestones, native issue types, project Priority,
 * native blocked-by relationships, and `Closes #N` links on open review PRs.
 * Done/abandoned tasks with still-open mirror issues are closed with the
 * matching state reason. Ledger ## Log sections are preserved as one comment.
 *
 * Usage: pnpm exec tsx scripts/migrate-work-to-issues.ts [--dry-run]
 * Idempotent: PATCHes and project writes overwrite to the same end state.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { newBody, setSection } from './work-issues/body';
import { areaLabel, parseWorkType, REPO } from './work-issues/config';
import { type GhRunner, ghFailureHint, runGh } from './work-issues/gh';
import {
	getNumber,
	getString,
	isRecord,
	parseJson,
	recordEntries,
} from './work-issues/json';
import type { PriorityField, ProjectRef } from './work-issues/mutations';
import {
	addBlockedBy,
	addComment,
	milestoneNumberForPhase,
	resolvePriorityField,
	resolveProject,
	setIssuePriority,
} from './work-issues/mutations';
import type { Priority, Result } from './work-issues/types';

type LedgerTask = {
	id: string;
	title: string;
	type: string;
	area: string[];
	phase: number;
	status: string;
	priority: Priority;
	assignee?: string;
	blockedBy: string[];
	acceptance: string[];
	pr?: number;
	file: string;
};

type IssueRef = { number: number; url: string; state: string };

const DRY_RUN = process.argv.includes('--dry-run');
const WORK_DIR = join(process.cwd(), 'work');
/** Ledger assignees are role names; map them to the GitHub login that acts. */
const ASSIGNEE_LOGIN = 'Eiluviann';

main();

type MigrationContext = {
	run: GhRunner;
	project: ProjectRef;
	priorityField: PriorityField;
	milestoneByPhase: Map<number, number>;
};

function main(): void {
	const run: GhRunner = runGh;
	const tasks = loadLedger();
	const issuesByTwId = loadIssueMap(run);
	const project = unwrap(resolveProject(run));
	const context: MigrationContext = {
		run,
		project,
		priorityField: unwrap(resolvePriorityField(run, project)),
		milestoneByPhase: new Map<number, number>(),
	};

	const mapping: string[] = [
		'| Task | Issue | Action |',
		'| --- | --- | --- |',
	];
	for (const task of tasks) {
		mapping.push(...migrateTask(context, task, issuesByTwId.get(task.id)));
	}
	linkDependencies(run, tasks, issuesByTwId);
	console.log(mapping.join('\n'));
}

/** Migrates one ledger task; returns its mapping-table rows (0 or 1). */
function migrateTask(
	context: MigrationContext,
	task: LedgerTask,
	issue: IssueRef | undefined,
): string[] {
	const { run } = context;
	if (issue === undefined) {
		if (task.status === 'done' || task.status === 'abandoned') return [];
		console.error(`work: ${task.id} (${task.status}) has no issue — skipped`);
		return [`| ${task.id} | - | MISSING (${task.status}) |`];
	}
	if (task.status === 'done' || task.status === 'abandoned') {
		if (issue.state !== 'OPEN') return [];
		closeIssue(run, issue.number, task.status);
		return [`| ${task.id} | #${issue.number} | closed (${task.status}) |`];
	}

	// Open work: retrofit in place.
	const milestone =
		context.milestoneByPhase.get(task.phase) ??
		unwrap(milestoneNumberForPhase(run, task.phase));
	context.milestoneByPhase.set(task.phase, milestone);
	retrofitIssue(run, task, issue, milestone);
	applyPriority(
		run,
		context.project,
		context.priorityField,
		issue,
		task.priority,
	);
	if (task.status === 'active') assign(run, issue.number, ASSIGNEE_LOGIN);
	migrateLog(run, task, issue.number);
	if (task.status === 'review' && task.pr !== undefined) {
		linkReviewPr(run, task.pr, issue.number);
	}
	return [`| ${task.id} | #${issue.number} | retrofitted (${task.status}) |`];
}

/** Second pass: native blocked-by links, once every issue number is known. */
function linkDependencies(
	run: GhRunner,
	tasks: readonly LedgerTask[],
	issuesByTwId: Map<string, IssueRef>,
): void {
	for (const task of tasks) {
		if (task.status === 'done' || task.status === 'abandoned') continue;
		const issue = issuesByTwId.get(task.id);
		if (issue === undefined) continue;
		for (const blockerId of task.blockedBy) {
			const blocker = issuesByTwId.get(blockerId);
			if (blocker === undefined) {
				console.error(`work: ${task.id} blocked_by ${blockerId} has no issue`);
				continue;
			}
			addDependency(run, issue.number, blocker.number);
		}
	}
}

// --- Ledger ---

function loadLedger(): LedgerTask[] {
	const raw = execTsx(['scripts/work.ts', 'export', '--json']);
	const parsed = parseJson(raw);
	if (!Array.isArray(parsed)) {
		throw new Error('work export --json did not return an array');
	}
	return recordEntries(parsed).flatMap<LedgerTask>((entry) => {
		const id = getString(entry, 'id');
		const title = getString(entry, 'title');
		const file = getString(entry, 'file');
		if (id === undefined || title === undefined || file === undefined) {
			return [];
		}
		const priorityRaw = getString(entry, 'priority') ?? 'p2';
		const priority: Priority =
			priorityRaw === 'p0' || priorityRaw === 'p1' || priorityRaw === 'p3'
				? priorityRaw
				: 'p2';
		return [
			{
				id,
				title,
				file,
				type: getString(entry, 'type') ?? 'feat',
				area: stringArray(entry.area),
				phase: getNumber(entry, 'phase') ?? 0,
				status: getString(entry, 'status') ?? 'backlog',
				priority,
				assignee: getString(entry, 'assignee'),
				blockedBy: stringArray(entry.blockedBy),
				acceptance: stringArray(entry.acceptance),
				pr: getNumber(entry, 'pr'),
			},
		];
	});
}

function ledgerSection(file: string, name: string): string | undefined {
	const content = readFileSync(join(WORK_DIR, file), 'utf8');
	const lines = content.split('\n');
	const start = lines.findIndex((line) =>
		new RegExp(`^## ${name}\\s*$`, 'i').test(line),
	);
	if (start === -1) return undefined;
	const end = lines.findIndex((line, i) => i > start && /^## /.test(line));
	const section = lines
		.slice(start + 1, end === -1 ? undefined : end)
		.join('\n');
	const body = stripHtmlComments(section).trim();
	return body.length > 0 ? body : undefined;
}

/** Removes HTML comments, re-scanning until stable so no `<!--` survives. */
function stripHtmlComments(text: string): string {
	let previous = text;
	let current = text.replace(/<!--[\s\S]*?-->/g, '');
	while (current !== previous) {
		previous = current;
		current = current.replace(/<!--[\s\S]*?-->/g, '');
	}
	return current;
}

// --- Issue map ---

function loadIssueMap(run: GhRunner): Map<string, IssueRef> {
	const result = run([
		'issue',
		'list',
		'--state',
		'all',
		'--limit',
		'300',
		'--json',
		'number,title,url,state',
	]);
	if (!result.ok) throw new Error(ghFailureHint(result.error));
	const parsed = parseJson(result.value);
	const map = new Map<string, IssueRef>();
	for (const entry of recordEntries(Array.isArray(parsed) ? parsed : [])) {
		const title = getString(entry, 'title') ?? '';
		const number = getNumber(entry, 'number');
		const url = getString(entry, 'url') ?? '';
		const state = getString(entry, 'state') ?? 'OPEN';
		const match = /^(TW-\d+):/.exec(title);
		if (match?.[1] === undefined || number === undefined) continue;
		// First match wins: list is newest-first, but ids are unique in titles.
		if (!map.has(match[1])) map.set(match[1], { number, url, state });
	}
	return map;
}

// --- Mutations ---

function retrofitIssue(
	run: GhRunner,
	task: LedgerTask,
	issue: IssueRef,
	milestoneNumber: number,
): void {
	let body = newBody({
		context:
			ledgerSection(task.file, 'Context') ??
			`Migrated from \`work/${task.file}\`.`,
		scope: ledgerSection(task.file, 'Scope') ?? 'In: ...\nOut: ...',
		acceptance: task.acceptance,
	});
	const acceptanceSection = ledgerSection(task.file, 'Acceptance');
	if (acceptanceSection !== undefined) {
		body = unwrap(setSection(body, 'Acceptance', acceptanceSection));
	}
	const plan = ledgerSection(task.file, 'Plan');
	if (plan !== undefined) {
		body = unwrap(setSection(body, 'Plan', plan));
	}
	const alternatives = ledgerSection(task.file, 'Alternatives considered');
	if (alternatives !== undefined) {
		body = unwrap(setSection(body, 'Alternatives considered', alternatives));
	}

	const workType = parseWorkType(task.type) ?? 'feat';
	const typeName = {
		feat: 'Feature',
		fix: 'Bug',
		refactor: 'Refactor',
		chore: 'Chore',
		docs: 'Docs',
		test: 'Test',
	}[workType];

	if (DRY_RUN) {
		console.log(`dry-run: would retrofit #${issue.number} (${task.id})`);
		return;
	}
	const patched = patchIssue(run, issue.number, {
		title: `${task.id}: ${task.title}`,
		body,
		labels: task.area.map(areaLabel),
		milestone: milestoneNumber,
		type: typeName,
	});
	if (!patched.ok) {
		throw new Error(`retrofit #${issue.number} failed: ${patched.error}`);
	}
}

function closeIssue(
	run: GhRunner,
	number: number,
	status: 'done' | 'abandoned' | string,
): void {
	if (DRY_RUN) {
		console.log(`dry-run: would close #${number} (${status})`);
		return;
	}
	const patched = patchIssue(run, number, {
		state: 'closed',
		// biome-ignore lint/style/useNamingConvention: GitHub API wire format
		state_reason: status === 'done' ? 'completed' : 'not_planned',
	});
	if (!patched.ok) {
		console.error(`work: closing #${number} failed: ${patched.error}`);
	}
}

function applyPriority(
	run: GhRunner,
	project: ProjectRef,
	field: PriorityField,
	issue: IssueRef,
	priority: Priority,
): void {
	if (DRY_RUN) return;
	const result = setIssuePriority(run, project, field, issue.url, priority);
	if (!result.ok) {
		console.error(`work: priority on #${issue.number} failed: ${result.error}`);
	}
}

function assign(run: GhRunner, number: number, login: string): void {
	if (DRY_RUN) return;
	const result = run(
		[
			'api',
			'-X',
			'POST',
			`repos/${REPO}/issues/${number}/assignees`,
			'--input',
			'-',
		],
		JSON.stringify({ assignees: [login] }),
	);
	if (!result.ok) {
		console.error(
			`work: assign #${number} failed: ${ghFailureHint(result.error)}`,
		);
	}
}

function migrateLog(run: GhRunner, task: LedgerTask, number: number): void {
	const log = ledgerSection(task.file, 'Log');
	if (log === undefined || DRY_RUN) return;
	const comment = addComment(
		run,
		number,
		`Migrated log from \`work/${task.file}\` (TW-055 cutover):\n\n${log}`,
	);
	if (!comment.ok) {
		console.error(`work: log comment on #${number} failed: ${comment.error}`);
	}
}

function linkReviewPr(
	run: GhRunner,
	prNumber: number,
	issueNumber: number,
): void {
	const view = run(['pr', 'view', String(prNumber), '--json', 'state,body']);
	if (!view.ok) {
		console.error(
			`work: PR #${prNumber} not readable: ${ghFailureHint(view.error)}`,
		);
		return;
	}
	const parsed = parseJson(view.value);
	if (!isRecord(parsed)) return;
	const state = getString(parsed, 'state');
	const body = getString(parsed, 'body') ?? '';
	if (state !== 'OPEN') {
		console.error(
			`work: PR #${prNumber} is ${state ?? 'unknown'}, not linking (task may need status correction)`,
		);
		return;
	}
	if (body.includes(`Closes #${issueNumber}`)) return;
	if (DRY_RUN) return;
	const edited = run([
		'pr',
		'edit',
		String(prNumber),
		'--body',
		`${body}\n\nCloses #${issueNumber}`,
	]);
	if (!edited.ok) {
		console.error(
			`work: PR #${prNumber} edit failed: ${ghFailureHint(edited.error)}`,
		);
	}
}

function addDependency(
	run: GhRunner,
	number: number,
	blockerNumber: number,
): void {
	if (DRY_RUN) return;
	const result = addBlockedBy(run, number, blockerNumber);
	if (!result.ok && !/already|duplicate/i.test(result.error)) {
		console.error(
			`work: #${number} blocked-by #${blockerNumber} failed: ${result.error}`,
		);
	}
}

// --- Helpers ---

function patchIssue(
	run: GhRunner,
	number: number,
	payload: Record<string, unknown>,
): Result<undefined> {
	const result = run(
		['api', '-X', 'PATCH', `repos/${REPO}/issues/${number}`, '--input', '-'],
		JSON.stringify(payload),
	);
	return result.ok
		? { ok: true, value: undefined }
		: { ok: false, error: ghFailureHint(result.error) };
}

function execTsx(args: string[]): string {
	return execFileSync('pnpm', ['exec', 'tsx', ...args], {
		encoding: 'utf8',
		maxBuffer: 32 * 1024 * 1024,
	});
}

function stringArray(value: unknown): string[] {
	return Array.isArray(value)
		? value.filter((item): item is string => typeof item === 'string')
		: [];
}

function unwrap<T>(result: Result<T>): T {
	if (!result.ok) throw new Error(result.error);
	return result.value;
}

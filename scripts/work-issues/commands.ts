/**
 * Command implementations for the issue-first work CLI. Argument parsing and
 * printing live here; GitHub IO lives in github.ts / mutations.ts; pure logic
 * (derivation, trust, body sections, cursors) lives in its own modules.
 */

import { readFileSync } from 'node:fs';
import { isPlanFilled, newBody, SECTION_NAMES, setSection } from './body';
import {
	commentsSince,
	latestTimestamp,
	nextCache,
	readCache,
	writeCache,
} from './cache';
import {
	AREAS,
	areaLabel,
	DEFAULT_PRIORITY,
	MAX_PHASE,
	PRIORITIES,
	parsePriority,
	parseWorkType,
	WORK_TYPES,
} from './config';
import type { GhRunner } from './gh';
import { ghFailureHint } from './gh';
import { fetchSingleIssue, fetchSnapshot } from './github';
import { getString, isRecord, parseJson } from './json';
import {
	addAssignee,
	addBlockedBy,
	addComment,
	addLabels,
	createIssue,
	ensureAreaLabels,
	ensureIssueTypes,
	ensureMilestones,
	ensurePriorityField,
	ensureProject,
	milestoneNumberForPhase,
	probeDependencies,
	removeBlockedBy,
	removeLabel,
	resolvePriorityField,
	resolveProject,
	setIssuePriority,
	setIssueType,
	updateIssueBody,
} from './mutations';
import type {
	Priority,
	Result,
	WorkCache,
	WorkIssue,
	WorkSnapshot,
	WorkStatus,
} from './types';

type SnapshotSource = {
	snapshot: WorkSnapshot;
	cache: WorkCache;
	fromCache: boolean;
};

const PRIORITY_ORDER: Record<Priority, number> = { p0: 0, p1: 1, p2: 2, p3: 3 };
const STATUSES: readonly WorkStatus[] = [
	'backlog',
	'active',
	'review',
	'done',
	'blocked',
	'abandoned',
];

// --- Commands ---

export function runBootstrap(run: GhRunner): void {
	const lines: string[] = [];
	const labels = ensureAreaLabels(run);
	if (!labels.ok) fail(labels.error);
	lines.push(...labels.value);

	const milestones = ensureMilestones(run);
	if (!milestones.ok) fail(milestones.error);
	lines.push(...milestones.value);

	const issueTypes = ensureIssueTypes(run);
	lines.push(...issueTypes.lines);

	const project = ensureProject(run);
	if (!project.ok) {
		lines.push(`project: FAILED (${project.error})`);
	} else {
		lines.push(`project #${project.value.number}: ok`);
		const field = ensurePriorityField(run, project.value);
		lines.push(
			field.ok
				? `priority field: ok (${Object.keys(field.value.optionIds).join(', ')})`
				: `priority field: FAILED (${field.error})`,
		);
	}

	const sample = run([
		'api',
		'repos/threadwick-hq/threadwick/issues?per_page=1&state=all',
		'--jq',
		'.[0].number',
	]);
	const sampleNumber = sample.ok
		? Number.parseInt(sample.value.trim(), 10)
		: Number.NaN;
	const dependencies = probeDependencies(
		run,
		Number.isSafeInteger(sampleNumber) ? sampleNumber : undefined,
	);
	lines.push(dependencies.line);

	for (const line of lines) console.log(`work: ${line}`);
	refreshCache(run, { reprobe: true });
}

export function runNew(run: GhRunner, rest: string[]): void {
	const title = getFlag(rest, '--title');
	if (title === undefined) usage('work new --title "..." is required');
	const type = parseWorkType(getFlag(rest, '--type') ?? 'feat');
	if (type === undefined) {
		usage(`work new: --type must be one of ${WORK_TYPES.join('|')}`);
	}
	const areas = getFlagAll(rest, '--area');
	const resolvedAreas = areas.length > 0 ? areas : ['repo'];
	for (const area of resolvedAreas) {
		if (!AREAS.some((known) => known === area)) {
			usage(`work new: unknown area "${area}"`);
		}
	}
	const phase = Number.parseInt(getFlag(rest, '--phase') ?? '0', 10);
	if (!Number.isInteger(phase) || phase < 0 || phase > MAX_PHASE) {
		usage(`work new: --phase must be 0..${MAX_PHASE}`);
	}
	const priority = parsePriority(
		getFlag(rest, '--priority') ?? DEFAULT_PRIORITY,
	);
	if (priority === undefined) {
		usage(`work new: --priority must be one of ${PRIORITIES.join('|')}`);
	}

	const milestone = milestoneNumberForPhase(run, phase);
	if (!milestone.ok) fail(milestone.error);

	const body = newBody({
		context: getFlag(rest, '--context') ?? '',
		scope: getFlag(rest, '--scope') ?? '',
		acceptance: getFlagAll(rest, '--accept'),
	});
	const created = createIssue(run, {
		title,
		body,
		labels: resolvedAreas.map(areaLabel),
		milestoneNumber: milestone.value,
	});
	if (!created.ok) fail(created.error);

	const typed = setIssueType(run, created.value.number, type);
	if (!typed.ok) warn(`issue type not set: ${typed.error}`);
	const prioritized = applyPriority(run, created.value.url, priority);
	if (!prioritized.ok) warn(`priority not set: ${prioritized.error}`);

	console.log(`work: created #${created.value.number} ${created.value.url}`);
	refreshCache(run, {});
}

export function runClaim(run: GhRunner, rest: string[]): void {
	const number = requireIssueNumber(rest, 'claim');
	const source = loadSnapshot(run, {});
	if (source.fromCache) {
		fail('cannot claim while offline: a claim must reach GitHub');
	}
	if (source.snapshot.viewerLogin === '') {
		fail(
			'cannot resolve the viewer login (check `gh auth status`); claiming needs an identity',
		);
	}
	const issue = findIssue(source.snapshot, number);
	if (issue.status !== 'backlog') {
		fail(
			`#${number} is "${issue.status}" — only backlog issues can be claimed`,
		);
	}
	if (!issue.triaged) {
		fail(
			`#${number} is not triaged (needs type, area label, milestone, priority) — a member must triage it first`,
		);
	}
	const assigned = addAssignee(run, number, source.snapshot.viewerLogin);
	if (!assigned.ok) fail(assigned.error);
	console.log(`work: claimed #${number} for ${source.snapshot.viewerLogin}`);
	console.log(`  branch feat/${number}-${slugify(issue.title)}`);
	refreshCache(run, {});
}

export function runBlock(run: GhRunner, rest: string[]): void {
	const number = requireIssueNumber(rest, 'block');
	const onRaw = getFlag(rest, '--on');
	const blocker = onRaw === undefined ? Number.NaN : Number.parseInt(onRaw, 10);
	if (!Number.isSafeInteger(blocker)) {
		usage('work block <number> --on <blocker-number>');
	}
	const source = loadSnapshot(run, {});
	if (source.snapshot.dependencyMode === 'label') {
		const labeled = addLabels(run, number, ['blocked']);
		if (!labeled.ok) fail(labeled.error);
		const noted = addComment(run, number, `Blocked by #${blocker}.`);
		if (!noted.ok) fail(noted.error);
		console.log(
			`work: #${number} marked blocked by #${blocker} (label mode; native dependencies unavailable)`,
		);
	} else {
		const added = addBlockedBy(run, number, blocker);
		if (!added.ok) fail(added.error);
		console.log(`work: #${number} is now blocked by #${blocker}`);
	}
	refreshCache(run, {});
}

export function runUnblock(run: GhRunner, rest: string[]): void {
	const number = requireIssueNumber(rest, 'unblock');
	const onRaw = getFlag(rest, '--on');
	const blocker = onRaw === undefined ? Number.NaN : Number.parseInt(onRaw, 10);
	const source = loadSnapshot(run, {});
	if (source.snapshot.dependencyMode === 'label') {
		const removed = removeLabel(run, number, 'blocked');
		if (!removed.ok) fail(removed.error);
		console.log(`work: removed blocked label from #${number}`);
	} else {
		if (!Number.isSafeInteger(blocker)) {
			usage('work unblock <number> --on <blocker-number>');
		}
		const removed = removeBlockedBy(run, number, blocker);
		if (!removed.ok) fail(removed.error);
		console.log(`work: #${number} is no longer blocked by #${blocker}`);
	}
	refreshCache(run, {});
}

export function runList(run: GhRunner, rest: string[]): void {
	const source = loadSnapshot(run, {});
	const wantedStatus = getFlag(rest, '--status');
	if (wantedStatus !== undefined && !STATUSES.some((s) => s === wantedStatus)) {
		usage(`work list: --status must be one of ${STATUSES.join('|')}`);
	}
	const wantedArea = getFlag(rest, '--area');
	const wantedPhase = parsePhaseFlag(rest, 'list');
	const wantedType = getFlag(rest, '--type');
	const issues = source.snapshot.issues
		.filter(
			(issue) => wantedStatus === undefined || issue.status === wantedStatus,
		)
		.filter(
			(issue) => wantedArea === undefined || issue.areas.includes(wantedArea),
		)
		.filter((issue) => wantedPhase === undefined || issue.phase === wantedPhase)
		.filter((issue) => wantedType === undefined || issue.type === wantedType)
		.sort(byPriorityThenAge);
	if (hasFlag(rest, '--json')) {
		console.log(JSON.stringify(issues, null, 2));
		return;
	}
	for (const issue of issues) {
		console.log(formatIssueLine(issue));
	}
	console.log(
		`  ${issues.length} issue(s)${source.fromCache ? ' (from cache)' : ''}`,
	);
}

export function runNext(run: GhRunner, rest: string[]): void {
	const source = loadSnapshot(run, {});
	const wantedArea = getFlag(rest, '--area');
	const wantedPhase = parsePhaseFlag(rest, 'next');
	const claimable = source.snapshot.issues
		.filter((issue) => issue.status === 'backlog' && issue.triaged)
		.filter(
			(issue) => wantedArea === undefined || issue.areas.includes(wantedArea),
		)
		.filter((issue) => wantedPhase === undefined || issue.phase === wantedPhase)
		.sort(byPriorityThenAge);
	const top = claimable[0];
	if (top === undefined) {
		console.log('work: no claimable issues');
		return;
	}
	console.log(formatIssueLine(top));
	console.log(`  claim with: pnpm run work claim ${top.number}`);
}

export function runShow(run: GhRunner, rest: string[]): void {
	const number = requireIssueNumber(rest, 'show');
	const source = loadSnapshot(run, {});
	const cached = source.snapshot.issues.find((i) => i.number === number);
	const issue =
		cached ??
		unwrap(
			fetchSingleIssue(
				run,
				number,
				{
					dependencyMode: source.snapshot.dependencyMode,
					issueTypesAvailable: source.snapshot.issueTypesAvailable,
				},
				source.snapshot,
			),
		);
	if (hasFlag(rest, '--json')) {
		console.log(JSON.stringify(issue, null, 2));
		return;
	}
	if (hasFlag(rest, '--md')) {
		console.log(renderMarkdownSnapshot(issue));
		return;
	}
	printIssueDetails(issue);
}

export function runUpdate(run: GhRunner, rest: string[]): void {
	const number = requireIssueNumber(rest, 'update');
	const section = getFlag(rest, '--section');
	if (section === undefined) {
		usage(
			`work update <number> --section <${SECTION_NAMES.join('|')}> [--file f] (or content on stdin)`,
		);
	}
	setBodySection(run, number, section, readContent(rest));
	console.log(`work: updated ${section} on #${number}`);
	refreshCache(run, {});
}

export function runPlan(run: GhRunner, rest: string[]): void {
	const number = requireIssueNumber(rest, 'plan');
	setBodySection(run, number, 'Plan', readContent(rest));
	const alternativesFile = getFlag(rest, '--alternatives-file');
	if (alternativesFile !== undefined) {
		setBodySection(
			run,
			number,
			'Alternatives considered',
			readFileSync(alternativesFile, 'utf8'),
		);
	}
	console.log(`work: plan recorded on #${number}`);
	refreshCache(run, {});
}

export function runLog(run: GhRunner, rest: string[]): void {
	const number = requireIssueNumber(rest, 'log');
	const numberIndex = rest.indexOf(String(number));
	const message = rest
		.slice(numberIndex + 1)
		.filter((arg) => !arg.startsWith('--'))
		.join(' ')
		.trim();
	if (message.length === 0) usage('work log <number> "message"');
	const posted = addComment(run, number, message);
	if (!posted.ok) fail(posted.error);
	console.log(`work: logged to #${number}`);
	refreshCache(run, {});
}

export function runInbox(run: GhRunner, rest: string[]): void {
	const explicit = rest.find((arg) => /^\d+$/.test(arg));
	const peek = hasFlag(rest, '--peek');
	const source = loadSnapshot(run, {});
	const issues =
		explicit !== undefined
			? source.snapshot.issues.filter(
					(issue) => issue.number === Number.parseInt(explicit, 10),
				)
			: source.snapshot.issues.filter((issue) =>
					issue.assignees.includes(source.snapshot.viewerLogin),
				);
	if (issues.length === 0) {
		console.log('work: inbox empty (no matching issues)');
		return;
	}
	let anything = false;
	for (const issue of issues) {
		const cursor = source.cache.cursors[String(issue.number)];
		const fresh = commentsSince(issue.comments, cursor);
		if (fresh.length === 0) continue;
		anything = true;
		console.log(`#${issue.number} ${issue.title}`);
		for (const comment of fresh) {
			if (comment.trusted) {
				console.log(`  [${comment.createdAt}] @${comment.authorLogin}:`);
				for (const line of comment.body.split('\n')) {
					console.log(`    ${line}`);
				}
			} else {
				console.log(
					`  [${comment.createdAt}] @${comment.authorLogin}: QUARANTINED (untrusted author; content withheld)`,
				);
				console.log(`    release with a member comment: /allow ${comment.url}`);
			}
		}
		if (!peek) {
			const latest = latestTimestamp(issue.comments);
			if (latest !== undefined) {
				source.cache.cursors[String(issue.number)] = latest;
			}
		}
	}
	if (!anything) console.log('work: no new comments');
	if (!peek) writeCache(source.cache);
}

export function runCheck(run: GhRunner, rest: string[]): void {
	const source = loadSnapshot(run, {});
	const violations: string[] = [];
	const untriaged: string[] = [];
	for (const issue of source.snapshot.issues) {
		const problems: string[] = [];
		if (source.snapshot.issueTypesAvailable && issue.type === undefined) {
			problems.push('missing issue type');
		}
		if (issue.areas.length === 0) problems.push('missing area label');
		if (issue.phase === undefined) problems.push('missing milestone');
		if (
			source.snapshot.projectNumber !== undefined &&
			issue.priority === undefined
		) {
			problems.push('missing priority');
		}
		if (!issue.hasWorkMarker) problems.push('missing work:v1 body marker');
		if (!issue.bodyTrusted) {
			problems.push(
				'body not trusted (untrusted author or last editor) — needs member re-triage',
			);
		}
		if (problems.length === 0) continue;
		const bare =
			issue.type === undefined &&
			issue.areas.length === 0 &&
			issue.phase === undefined &&
			!issue.hasWorkMarker;
		if (bare) {
			untriaged.push(`#${issue.number} ${issue.title} (@${issue.authorLogin})`);
		} else {
			violations.push(
				`#${issue.number} ${issue.title}: ${problems.join('; ')}`,
			);
		}
	}
	for (const line of untriaged) {
		console.log(`work: awaiting triage — ${line}`);
	}
	for (const line of violations) {
		console.error(`work: violation — ${line}`);
	}
	if (hasFlag(rest, '--json')) {
		console.log(JSON.stringify({ violations, untriaged }, null, 2));
	}
	console.log(
		`work: checked ${source.snapshot.issues.length} open issue(s): ${violations.length} violation(s), ${untriaged.length} awaiting triage`,
	);
	if (violations.length > 0) process.exit(1);
}

/**
 * CI gate for a pull request: the body must close at least one issue, and
 * every closed issue must be assigned with a filled Plan section. Priority
 * and full triage are validated by `check` where project access exists.
 */
export function runGate(run: GhRunner, rest: string[]): void {
	const prRaw = getFlag(rest, '--pr');
	const prNumber =
		prRaw === undefined ? Number.NaN : Number.parseInt(prRaw, 10);
	if (!Number.isSafeInteger(prNumber)) usage('work gate --pr <number>');
	const view = run(['pr', 'view', String(prNumber), '--json', 'body,author']);
	if (!view.ok) {
		fail(`cannot read PR #${prNumber}: ${ghFailureHint(view.error)}`);
	}
	const parsed = parseJson(view.value);
	const body = isRecord(parsed) ? (getString(parsed, 'body') ?? '') : '';
	// Bot-authored PRs (Dependabot bumps) are self-describing — the issue-first
	// rule governs agent/human work, so the linkage requirement is waived. All
	// other CI checks still gate them.
	const author = isRecord(parsed) ? parsed['author'] : undefined;
	const authorLogin = isRecord(author)
		? (getString(author, 'login') ?? '')
		: '';
	const isBotAuthor =
		(isRecord(author) && author['is_bot'] === true) ||
		authorLogin.endsWith('[bot]');
	if (isBotAuthor) {
		console.log(
			`work: gate ok — PR #${prNumber} is bot-authored (${authorLogin || 'unknown bot'}); issue linkage not required`,
		);
		return;
	}
	// GitHub's full auto-close keyword set; the documented convention is Closes.
	const refs = [
		...body.matchAll(/\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?) #(\d+)/gi),
	].flatMap((match) =>
		match[1] === undefined ? [] : [Number.parseInt(match[1], 10)],
	);
	if (refs.length === 0) {
		fail(`PR #${prNumber} body has no "Closes #<issue>" reference`);
	}
	const problems: string[] = [];
	for (const issueNumber of refs) {
		const issue = fetchSingleIssue(run, issueNumber);
		if (!issue.ok) {
			problems.push(`#${issueNumber}: ${issue.error}`);
			continue;
		}
		if (issue.value.assignees.length === 0) {
			problems.push(`#${issueNumber} is unassigned — claim it first`);
		}
		if (!isPlanFilled(issue.value.body)) {
			problems.push(
				`#${issueNumber} Plan section is not filled — record it with \`work plan ${issueNumber}\``,
			);
		}
	}
	for (const problem of problems) console.error(`work: gate — ${problem}`);
	if (problems.length > 0) process.exit(1);
	console.log(
		`work: gate ok — PR #${prNumber} closes ${refs.map((n) => `#${n}`).join(', ')}`,
	);
}

// --- Snapshot loading (network with cache fallback) ---

function loadSnapshot(
	run: GhRunner,
	options: { reprobe?: boolean },
): SnapshotSource {
	const previous = readCache();
	const hints =
		options.reprobe === true || !previous.ok
			? {}
			: {
					dependencyMode: previous.value.snapshot.dependencyMode,
					issueTypesAvailable: previous.value.snapshot.issueTypesAvailable,
				};
	const fresh = fetchSnapshot(run, hints);
	if (fresh.ok) {
		const snapshot = withRetainedViewer(
			fresh.value,
			previous.ok ? previous.value.snapshot : undefined,
		);
		const cache = nextCache(snapshot, previous.ok ? previous.value : undefined);
		const written = writeCache(cache);
		if (!written.ok) warn(written.error);
		return { snapshot, cache, fromCache: false };
	}
	if (previous.ok) {
		warn(
			`GitHub unreachable (${fresh.error}); using cached snapshot from ${previous.value.snapshot.fetchedAt}`,
		);
		return {
			snapshot: previous.value.snapshot,
			cache: previous.value,
			fromCache: true,
		};
	}
	fail(`GitHub unreachable and no cache available: ${fresh.error}`);
}

function refreshCache(run: GhRunner, options: { reprobe?: boolean }): void {
	const previous = readCache();
	const hints =
		options.reprobe === true || !previous.ok
			? {}
			: {
					dependencyMode: previous.value.snapshot.dependencyMode,
					issueTypesAvailable: previous.value.snapshot.issueTypesAvailable,
				};
	const fresh = fetchSnapshot(run, hints);
	if (!fresh.ok) {
		warn(`cache not refreshed: ${fresh.error}`);
		return;
	}
	const snapshot = withRetainedViewer(
		fresh.value,
		previous.ok ? previous.value.snapshot : undefined,
	);
	const written = writeCache(
		nextCache(snapshot, previous.ok ? previous.value : undefined),
	);
	if (!written.ok) warn(written.error);
}

/**
 * A transient /user failure must not overwrite a known identity in the shared
 * cache: hooks key on viewerLogin, and an empty one would fail-close them
 * with a misleading "claim an issue" remedy.
 */
function withRetainedViewer(
	fresh: WorkSnapshot,
	previous: WorkSnapshot | undefined,
): WorkSnapshot {
	if (fresh.viewerLogin !== '') return fresh;
	if (previous === undefined || previous.viewerLogin === '') return fresh;
	warn(
		`viewer login unavailable this run; keeping cached identity ${previous.viewerLogin}`,
	);
	return { ...fresh, viewerLogin: previous.viewerLogin };
}

// --- Body editing ---

function setBodySection(
	run: GhRunner,
	number: number,
	section: string,
	content: string,
): void {
	const issue = unwrap(fetchSingleIssue(run, number));
	if (!issue.bodyTrusted) {
		fail(
			`#${number} body is quarantined (untrusted author or editor); a member must triage it before the CLI will edit it`,
		);
	}
	const updated = setSection(issue.body, section, content);
	if (!updated.ok) fail(updated.error);
	const patched = updateIssueBody(run, number, updated.value);
	if (!patched.ok) fail(patched.error);
}

function readContent(rest: string[]): string {
	const file = getFlag(rest, '--file');
	const content =
		file !== undefined ? readFileSync(file, 'utf8') : readFileSync(0, 'utf8');
	if (content.trim().length === 0) {
		usage('content is empty (pass --file or pipe via stdin)');
	}
	return content;
}

// --- Priority ---

function applyPriority(
	run: GhRunner,
	issueUrl: string,
	priority: Priority,
): Result<undefined> {
	const project = resolveProject(run);
	if (!project.ok) return project;
	const field = resolvePriorityField(run, project.value);
	if (!field.ok) return field;
	return setIssuePriority(run, project.value, field.value, issueUrl, priority);
}

// --- Printing ---

function formatIssueLine(issue: WorkIssue): string {
	const parts = [
		`#${String(issue.number).padEnd(5)}`,
		issue.status.padEnd(9),
		(issue.priority ?? '--').padEnd(3),
		(issue.type ?? '?').padEnd(8),
		issue.phase === undefined ? 'ph?' : `ph${issue.phase}`,
		issue.title,
	];
	return parts.join(' ');
}

function printIssueDetails(issue: WorkIssue): void {
	console.log(`#${issue.number}  ${issue.title}`);
	console.log(`  ${issue.url}`);
	console.log(
		`  status: ${issue.status}  type: ${issue.type ?? '?'}  priority: ${issue.priority ?? '?'}  phase: ${issue.phase ?? '?'}`,
	);
	console.log(
		`  areas: ${issue.areas.join(', ') || '-'}  assignees: ${issue.assignees.join(', ') || '-'}`,
	);
	if (issue.blockedBy.length > 0) {
		const blockers = issue.blockedBy
			.map((b) => `#${b.number}(${b.state.toLowerCase()})`)
			.join(', ');
		console.log(`  blocked by: ${blockers}`);
	}
	if (issue.linkedPullRequests.length > 0) {
		const prs = issue.linkedPullRequests
			.map((pr) => `#${pr.number}(${pr.state.toLowerCase()})`)
			.join(', ');
		console.log(`  linked PRs: ${prs}`);
	}
	console.log(`  plan: ${isPlanFilled(issue.body) ? 'filled' : 'not filled'}`);
	const quarantined = issue.comments.filter((c) => !c.trusted).length;
	console.log(
		`  comments: ${issue.comments.length} (${quarantined} quarantined)`,
	);
	if (!issue.bodyTrusted) {
		console.log('  body: QUARANTINED (untrusted author or editor)');
	}
}

function renderMarkdownSnapshot(issue: WorkIssue): string {
	const lines: string[] = [
		'<!-- generated by `work show --md`; read-only snapshot, never commit; edit via work commands -->',
		`# #${issue.number} ${issue.title}`,
		'',
		`- url: ${issue.url}`,
		`- status: ${issue.status} | type: ${issue.type ?? '?'} | priority: ${issue.priority ?? '?'} | phase: ${issue.phase ?? '?'}`,
		`- areas: ${issue.areas.join(', ') || '-'} | assignees: ${issue.assignees.join(', ') || '-'}`,
	];
	if (issue.blockedBy.length > 0) {
		lines.push(
			`- blocked by: ${issue.blockedBy.map((b) => `#${b.number} (${b.state.toLowerCase()})`).join(', ')}`,
		);
	}
	lines.push('');
	if (issue.bodyTrusted) {
		lines.push(issue.body.trim());
	} else {
		lines.push('_Body quarantined: untrusted author or editor._');
	}
	lines.push('', '---', '');
	for (const comment of issue.comments) {
		if (comment.trusted) {
			lines.push(
				`**@${comment.authorLogin}** (${comment.createdAt}):`,
				'',
				comment.body.trim(),
				'',
			);
		} else {
			lines.push(
				`**@${comment.authorLogin}** (${comment.createdAt}): _quarantined; release with \`/allow ${comment.url}\`_`,
				'',
			);
		}
	}
	return lines.join('\n');
}

// --- Small helpers ---

function byPriorityThenAge(a: WorkIssue, b: WorkIssue): number {
	const aOrder = a.priority === undefined ? 4 : PRIORITY_ORDER[a.priority];
	const bOrder = b.priority === undefined ? 4 : PRIORITY_ORDER[b.priority];
	if (aOrder !== bOrder) return aOrder - bOrder;
	return a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0;
}

function findIssue(snapshot: WorkSnapshot, number: number): WorkIssue {
	const issue = snapshot.issues.find(
		(candidate) => candidate.number === number,
	);
	if (issue === undefined) fail(`#${number} not found among open issues`);
	return issue;
}

function requireIssueNumber(rest: string[], command: string): number {
	const raw = rest.find((arg) => /^\d+$/.test(arg));
	if (raw === undefined) usage(`work ${command}: issue number is required`);
	return Number.parseInt(raw, 10);
}

function slugify(title: string): string {
	return title
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 40)
		.replace(/-+$/g, '');
}

function getFlag(rest: string[], name: string): string | undefined {
	const index = rest.indexOf(name);
	if (index === -1) return undefined;
	return rest[index + 1];
}

function parsePhaseFlag(rest: string[], command: string): number | undefined {
	const raw = getFlag(rest, '--phase');
	if (raw === undefined) return undefined;
	const phase = Number.parseInt(raw, 10);
	if (!Number.isInteger(phase) || phase < 0 || phase > MAX_PHASE) {
		usage(`work ${command}: --phase must be 0..${MAX_PHASE}`);
	}
	return phase;
}

function getFlagAll(rest: string[], name: string): string[] {
	const values: string[] = [];
	for (const [index, arg] of rest.entries()) {
		if (arg !== name) continue;
		const value = rest[index + 1];
		if (value !== undefined) values.push(value);
	}
	return values;
}

function hasFlag(rest: string[], name: string): boolean {
	return rest.includes(name);
}

function unwrap<T>(result: Result<T>): T {
	if (!result.ok) fail(result.error);
	return result.value;
}

function warn(message: string): void {
	console.error(`work: warning: ${message}`);
}

function fail(message: string): never {
	console.error(`work: ${message}`);
	process.exit(1);
}

function usage(message: string): never {
	console.error(`work: ${message}`);
	process.exit(2);
}

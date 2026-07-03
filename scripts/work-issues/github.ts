/**
 * Read side of the GitHub integration: fetches the work snapshot (open issues
 * with native fields, linked PRs, dependencies, project priority, comments)
 * and assembles trust-filtered, status-derived WorkIssues.
 *
 * Native-field availability is probed, not assumed: the GraphQL query retries
 * without `issueType` / `blockedByIssues` when the schema rejects them, and
 * dependencies fall back to REST, then to the `blocked` label.
 */

import { hasWorkMarker } from './body';
import {
	AREA_LABEL_PREFIX,
	PRIORITY_FIELD_NAME,
	PROJECT_TITLE,
	parsePriority,
	phaseFromMilestoneTitle,
	REPO,
	REPO_NAME,
	REPO_OWNER,
	workTypeFromIssueType,
} from './config';
import { deriveStatus } from './derive';
import type { GhRunner } from './gh';
import { ghFailureHint } from './gh';
import {
	getArray,
	getNumber,
	getRecord,
	getString,
	isRecord,
	parseJson,
	recordEntries,
} from './json';
import { isTrustedAuthor, toInboxComments } from './trust';
import type {
	BlockerRef,
	DependencyMode,
	LinkedPullRequest,
	Priority,
	RawComment,
	Result,
	WorkIssue,
	WorkSnapshot,
} from './types';

export type SnapshotHints = {
	dependencyMode?: DependencyMode;
	issueTypesAvailable?: boolean;
};

const BLOCKED_LABEL = 'blocked';

/** Fetches a fresh snapshot; the single entry point for all read commands. */
export function fetchSnapshot(
	run: GhRunner,
	hints: SnapshotHints = {},
): Result<WorkSnapshot> {
	// CI tokens (GITHUB_TOKEN) cannot call /user; degrade to an empty viewer so
	// read commands still work. Commands that act as the viewer must guard.
	const viewer = fetchViewerLogin(run);
	const viewerLogin = viewer.ok ? viewer.value : '';

	const issuesQuery = fetchIssueNodes(run, hints);
	if (!issuesQuery.ok) return issuesQuery;
	const { nodes, issueTypesAvailable, blockedByInGraphql } = issuesQuery.value;

	const projectNumber = resolveProjectNumber(run);

	const parsedIssues = nodes.map((node) => parseIssueNode(node, projectNumber));

	let dependencyMode: DependencyMode = blockedByInGraphql
		? 'graphql'
		: (hints.dependencyMode ?? 'rest');
	if (!blockedByInGraphql && dependencyMode !== 'label') {
		dependencyMode = attachRestDependencies(run, parsedIssues);
	}

	const issues = parsedIssues.map((issue) =>
		finalizeIssue(issue, dependencyMode, issueTypesAvailable, projectNumber),
	);

	return {
		ok: true,
		value: {
			fetchedAt: new Date().toISOString(),
			repo: REPO,
			viewerLogin,
			dependencyMode,
			issueTypesAvailable,
			projectNumber,
			issues,
		},
	};
}

/**
 * Fetches one issue (any state) as a WorkIssue, for `show` on closed items.
 * Pass an already-loaded snapshot to avoid a second full fetch.
 */
export function fetchSingleIssue(
	run: GhRunner,
	number: number,
	hints: SnapshotHints = {},
	preloaded?: WorkSnapshot,
): Result<WorkIssue> {
	const snapshot: Result<WorkSnapshot> =
		preloaded === undefined
			? fetchSnapshot(run, hints)
			: { ok: true, value: preloaded };
	if (!snapshot.ok) return snapshot;
	const open = snapshot.value.issues.find((issue) => issue.number === number);
	if (open !== undefined) return { ok: true, value: open };
	const single = fetchClosedIssueNode(run, number, hints);
	if (!single.ok) return single;
	const parsed = parseIssueNode(single.value, snapshot.value.projectNumber);
	return {
		ok: true,
		value: finalizeIssue(
			parsed,
			snapshot.value.dependencyMode,
			snapshot.value.issueTypesAvailable,
			snapshot.value.projectNumber,
		),
	};
}

// --- GraphQL fetch with field probing ---

type IssueNodesResult = {
	nodes: Record<string, unknown>[];
	issueTypesAvailable: boolean;
	blockedByInGraphql: boolean;
};

function fetchIssueNodes(
	run: GhRunner,
	hints: SnapshotHints,
): Result<IssueNodesResult> {
	let withIssueType = hints.issueTypesAvailable !== false;
	let withBlockedBy =
		hints.dependencyMode === undefined
			? true
			: hints.dependencyMode === 'graphql';
	for (let attempt = 0; attempt < 3; attempt += 1) {
		const result = run([
			'api',
			'graphql',
			'--paginate',
			'--slurp',
			'-f',
			`query=${issuesQuery(withIssueType, withBlockedBy)}`,
			'-f',
			`owner=${REPO_OWNER}`,
			'-f',
			`name=${REPO_NAME}`,
		]);
		if (result.ok) {
			const nodes = parseIssueNodesPayload(result.value);
			if (!nodes.ok) return nodes;
			return {
				ok: true,
				value: {
					nodes: nodes.value,
					issueTypesAvailable: withIssueType,
					blockedByInGraphql: withBlockedBy,
				},
			};
		}
		const message = result.error.message;
		if (withBlockedBy && /blockedBy/i.test(message)) {
			withBlockedBy = false;
			continue;
		}
		if (withIssueType && /issueType/i.test(message)) {
			withIssueType = false;
			continue;
		}
		return { ok: false, error: ghFailureHint(result.error) };
	}
	return { ok: false, error: 'GraphQL issue query failed after field probes' };
}

function issuesQuery(withIssueType: boolean, withBlockedBy: boolean): string {
	return `query($owner: String!, $name: String!, $endCursor: String) {
	repository(owner: $owner, name: $name) {
		issues(first: 50, states: [OPEN], orderBy: {field: CREATED_AT, direction: ASC}, after: $endCursor) {
			pageInfo { hasNextPage endCursor }
			nodes { ${issueSelection(withIssueType, withBlockedBy)} }
		}
	}
}`;
}

function singleIssueQuery(
	withIssueType: boolean,
	withBlockedBy: boolean,
): string {
	return `query($owner: String!, $name: String!, $number: Int!) {
	repository(owner: $owner, name: $name) {
		issue(number: $number) { ${issueSelection(withIssueType, withBlockedBy)} }
	}
}`;
}

function issueSelection(
	withIssueType: boolean,
	withBlockedBy: boolean,
): string {
	const issueType = withIssueType ? 'issueType { name }' : '';
	const blockedBy = withBlockedBy
		? 'blockedByIssues: blockedBy(first: 20) { nodes { number state } }'
		: '';
	return `
		number title url state stateReason createdAt updatedAt body
		author { login __typename }
		authorAssociation
		editor { login }
		${issueType}
		${blockedBy}
		assignees(first: 10) { nodes { login } }
		labels(first: 30) { nodes { name } }
		milestone { title }
		closedByPullRequestsReferences(first: 10, includeClosedPrs: true) { nodes { number state } }
		projectItems(first: 5) {
			nodes {
				project { number }
				fieldValueByName(name: "${PRIORITY_FIELD_NAME}") {
					... on ProjectV2ItemFieldSingleSelectValue { name }
				}
			}
		}
		comments(last: 50) {
			nodes {
				databaseId url createdAt body authorAssociation
				author { login __typename }
			}
		}`;
}

function parseIssueNodesPayload(
	payload: string,
): Result<Record<string, unknown>[]> {
	// --paginate --slurp wraps one JSON document per page into a JSON array.
	const parsed = parseJson(payload);
	const documents = Array.isArray(parsed)
		? parsed.filter(isRecord)
		: isRecord(parsed)
			? [parsed]
			: [];
	if (documents.length === 0) {
		return { ok: false, error: 'GraphQL response was not JSON' };
	}
	const nodes: Record<string, unknown>[] = [];
	for (const document of documents) {
		const data = getRecord(document, 'data');
		const repository =
			data === undefined ? undefined : getRecord(data, 'repository');
		const issues =
			repository === undefined ? undefined : getRecord(repository, 'issues');
		if (issues === undefined) {
			return { ok: false, error: 'GraphQL response missing repository.issues' };
		}
		nodes.push(...recordEntries(getArray(issues, 'nodes')));
	}
	return { ok: true, value: nodes };
}

function fetchClosedIssueNode(
	run: GhRunner,
	number: number,
	hints: SnapshotHints,
): Result<Record<string, unknown>> {
	const withIssueType = hints.issueTypesAvailable !== false;
	const withBlockedBy = hints.dependencyMode === 'graphql';
	const result = run([
		'api',
		'graphql',
		'-f',
		`query=${singleIssueQuery(withIssueType, withBlockedBy)}`,
		'-f',
		`owner=${REPO_OWNER}`,
		'-f',
		`name=${REPO_NAME}`,
		'-F',
		`number=${number}`,
	]);
	if (!result.ok) return { ok: false, error: ghFailureHint(result.error) };
	const document = parseJson(result.value);
	if (!isRecord(document)) {
		return { ok: false, error: 'GraphQL response was not JSON' };
	}
	const data = getRecord(document, 'data');
	const repository =
		data === undefined ? undefined : getRecord(data, 'repository');
	const issue =
		repository === undefined ? undefined : getRecord(repository, 'issue');
	if (issue === undefined) {
		return { ok: false, error: `issue #${number} not found` };
	}
	return { ok: true, value: issue };
}

// --- Node parsing ---

/** Issue parsed from GraphQL but with blockers possibly pending REST data. */
type ParsedIssue = {
	issue: Omit<WorkIssue, 'status' | 'bodyTrusted' | 'body' | 'comments'> & {
		body: string;
	};
	rawComments: RawComment[];
	authorIsBot: boolean;
	hasBlockedLabel: boolean;
	graphqlBlockers: BlockerRef[] | undefined;
};

function parseIssueNode(
	node: Record<string, unknown>,
	projectNumber: number | undefined,
): ParsedIssue {
	const author = getRecord(node, 'author');
	const authorLogin =
		author === undefined ? '' : (getString(author, 'login') ?? '');
	const authorIsBot =
		author !== undefined && getString(author, '__typename') === 'Bot';
	const labels = recordEntries(
		getArray(getRecord(node, 'labels') ?? {}, 'nodes'),
	)
		.map((label) => getString(label, 'name'))
		.filter((name): name is string => name !== undefined);
	const milestoneTitle = getString(getRecord(node, 'milestone') ?? {}, 'title');
	const issueTypeName = getString(getRecord(node, 'issueType') ?? {}, 'name');
	const body = getString(node, 'body') ?? '';
	const number = getNumber(node, 'number') ?? 0;
	const stateRaw = getString(node, 'state');

	const assignees = recordEntries(
		getArray(getRecord(node, 'assignees') ?? {}, 'nodes'),
	)
		.map((assignee) => getString(assignee, 'login'))
		.filter((login): login is string => login !== undefined);

	const linkedPullRequests = recordEntries(
		getArray(getRecord(node, 'closedByPullRequestsReferences') ?? {}, 'nodes'),
	).flatMap<LinkedPullRequest>((pullRequest) => {
		const prNumber = getNumber(pullRequest, 'number');
		const prState = getString(pullRequest, 'state');
		if (prNumber === undefined) return [];
		const state =
			prState === 'OPEN' || prState === 'MERGED' ? prState : 'CLOSED';
		return [{ number: prNumber, state }];
	});

	const graphqlBlockers = parseGraphqlBlockers(node);
	const rawComments = parseRawComments(node);
	const areas = labels
		.filter((name) => name.startsWith(AREA_LABEL_PREFIX))
		.map((name) => name.slice(AREA_LABEL_PREFIX.length));

	const type =
		issueTypeName === undefined
			? undefined
			: workTypeFromIssueType(issueTypeName);
	const workType = type ?? undefined;

	return {
		issue: {
			number,
			title: getString(node, 'title') ?? '',
			url: getString(node, 'url') ?? '',
			state: stateRaw === 'CLOSED' ? 'CLOSED' : 'OPEN',
			stateReason: getString(node, 'stateReason'),
			type: workType,
			areas,
			phase:
				milestoneTitle === undefined
					? undefined
					: phaseFromMilestoneTitle(milestoneTitle),
			priority: parseProjectPriority(node, projectNumber),
			assignees,
			authorLogin,
			authorAssociation: getString(node, 'authorAssociation') ?? 'NONE',
			lastEditedBy: getString(getRecord(node, 'editor') ?? {}, 'login'),
			hasWorkMarker: hasWorkMarker(body),
			triaged: false, // finalized below once all fields are known
			createdAt: getString(node, 'createdAt') ?? '',
			updatedAt: getString(node, 'updatedAt') ?? '',
			linkedPullRequests,
			blockedBy: [],
			body,
		},
		rawComments,
		authorIsBot,
		hasBlockedLabel: labels.includes(BLOCKED_LABEL),
		graphqlBlockers,
	};
}

function parseGraphqlBlockers(
	node: Record<string, unknown>,
): BlockerRef[] | undefined {
	const connection = getRecord(node, 'blockedByIssues');
	if (connection === undefined) return undefined;
	return recordEntries(getArray(connection, 'nodes')).flatMap<BlockerRef>(
		(blocker) => {
			const number = getNumber(blocker, 'number');
			if (number === undefined) return [];
			return [
				{
					number,
					state: getString(blocker, 'state') === 'CLOSED' ? 'CLOSED' : 'OPEN',
				},
			];
		},
	);
}

function parseRawComments(node: Record<string, unknown>): RawComment[] {
	return recordEntries(
		getArray(getRecord(node, 'comments') ?? {}, 'nodes'),
	).flatMap<RawComment>((comment) => {
		const id = getNumber(comment, 'databaseId');
		if (id === undefined) return [];
		const author = getRecord(comment, 'author');
		return [
			{
				id,
				url: getString(comment, 'url') ?? '',
				createdAt: getString(comment, 'createdAt') ?? '',
				body: getString(comment, 'body') ?? '',
				authorAssociation: getString(comment, 'authorAssociation') ?? 'NONE',
				authorLogin:
					author === undefined ? '' : (getString(author, 'login') ?? ''),
				authorIsBot:
					author !== undefined && getString(author, '__typename') === 'Bot',
			},
		];
	});
}

function parseProjectPriority(
	node: Record<string, unknown>,
	projectNumber: number | undefined,
): Priority | undefined {
	const items = recordEntries(
		getArray(getRecord(node, 'projectItems') ?? {}, 'nodes'),
	);
	for (const item of items) {
		const project = getRecord(item, 'project');
		const itemProjectNumber =
			project === undefined ? undefined : getNumber(project, 'number');
		if (projectNumber !== undefined && itemProjectNumber !== projectNumber) {
			continue;
		}
		const fieldValue = getRecord(item, 'fieldValueByName');
		const name =
			fieldValue === undefined ? undefined : getString(fieldValue, 'name');
		const priority = name === undefined ? undefined : parsePriority(name);
		if (priority !== undefined) return priority;
	}
	return undefined;
}

// --- Finalization (trust + derivation) ---

function finalizeIssue(
	parsed: ParsedIssue,
	dependencyMode: DependencyMode,
	issueTypesAvailable: boolean,
	projectNumber: number | undefined,
): WorkIssue {
	const blockedBy =
		parsed.graphqlBlockers ??
		(dependencyMode === 'label' ? [] : parsed.issue.blockedBy);
	const unresolvedBlockerCount =
		dependencyMode === 'label'
			? parsed.hasBlockedLabel
				? 1
				: 0
			: blockedBy.filter((blocker) => blocker.state === 'OPEN').length;

	// The shape requirements degrade with the environment: priority is only
	// required when this token can see the project at all (CI tokens cannot),
	// and the type only when the org exposes issue types.
	const triaged =
		parsed.issue.areas.length > 0 &&
		parsed.issue.phase !== undefined &&
		(projectNumber === undefined || parsed.issue.priority !== undefined) &&
		(!issueTypesAvailable || parsed.issue.type !== undefined);

	const authorTrusted = isTrustedAuthor(
		parsed.issue.authorAssociation,
		parsed.authorIsBot,
	);
	// GitHub only lets the issue author or users with write access edit a body,
	// so a non-author editor is trusted by platform enforcement. The dangerous
	// case is an untrusted author re-editing their own issue after triage.
	const editor = parsed.issue.lastEditedBy;
	const editorTrusted =
		editor === undefined ||
		editor !== parsed.issue.authorLogin ||
		authorTrusted;
	const bodyTrusted = (authorTrusted || triaged) && editorTrusted;
	// The title is attacker-controlled content too: withheld until the author
	// is trusted or a member has triaged the issue (and thereby read it).
	const titleTrusted = authorTrusted || triaged;

	const status = deriveStatus({
		state: parsed.issue.state,
		stateReason: parsed.issue.stateReason,
		assigneeCount: parsed.issue.assignees.length,
		hasOpenLinkedPullRequest: parsed.issue.linkedPullRequests.some(
			(pullRequest) => pullRequest.state === 'OPEN',
		),
		unresolvedBlockerCount,
	});

	return {
		...parsed.issue,
		title: titleTrusted
			? parsed.issue.title
			: `(title withheld: untrusted author @${parsed.issue.authorLogin})`,
		status,
		triaged,
		blockedBy,
		bodyTrusted,
		body: bodyTrusted ? parsed.issue.body : '',
		comments: toInboxComments(parsed.rawComments),
	};
}

// --- Secondary reads ---

function fetchViewerLogin(run: GhRunner): Result<string> {
	const result = run(['api', 'user', '--jq', '.login']);
	if (!result.ok) return { ok: false, error: ghFailureHint(result.error) };
	const login = result.value.trim();
	return login.length > 0
		? { ok: true, value: login }
		: { ok: false, error: 'could not resolve viewer login' };
}

/** Resolves the work project number by title; undefined when unavailable. */
export function resolveProjectNumber(run: GhRunner): number | undefined {
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
	if (!result.ok) return undefined;
	const parsed = parseJson(result.value);
	if (!isRecord(parsed)) return undefined;
	const projects = recordEntries(getArray(parsed, 'projects'));
	const project = projects.find(
		(candidate) => getString(candidate, 'title') === PROJECT_TITLE,
	);
	return project === undefined ? undefined : getNumber(project, 'number');
}

/**
 * Attaches REST dependency data to parsed issues in place. Returns the mode
 * that turned out to be usable ('rest', or 'label' when the API is absent).
 */
function attachRestDependencies(
	run: GhRunner,
	issues: ParsedIssue[],
): DependencyMode {
	let mode: DependencyMode = 'rest';
	for (const [index, parsed] of issues.entries()) {
		const result = run([
			'api',
			`repos/${REPO}/issues/${parsed.issue.number}/dependencies/blocked_by?per_page=50`,
		]);
		if (!result.ok) {
			// A 404 on the first call means the endpoint does not exist here.
			if (index === 0 && /404|Not Found/i.test(result.error.message)) {
				mode = 'label';
				break;
			}
			continue;
		}
		const parsedPayload = parseJson(result.value);
		const blockers = Array.isArray(parsedPayload)
			? recordEntries(parsedPayload).flatMap<BlockerRef>((blocker) => {
					const number = getNumber(blocker, 'number');
					if (number === undefined) return [];
					return [
						{
							number,
							state:
								getString(blocker, 'state') === 'closed' ? 'CLOSED' : 'OPEN',
						},
					];
				})
			: [];
		parsed.issue.blockedBy = blockers;
	}
	return mode;
}

/**
 * Shared types for the issue-first work CLI.
 *
 * The model layer is deliberately storage-free: status is always derived from
 * native GitHub signals (see derive.ts) and untrusted content is filtered out
 * before it can reach any agent-facing surface (see trust.ts).
 */

export type Result<T, E = string> =
	| { ok: true; value: T }
	| { ok: false; error: E };

export type WorkType = 'feat' | 'fix' | 'refactor' | 'chore' | 'docs' | 'test';

export type WorkStatus =
	| 'backlog'
	| 'active'
	| 'review'
	| 'done'
	| 'blocked'
	| 'abandoned';

export type Priority = 'p0' | 'p1' | 'p2' | 'p3';

/** How blocked-by relationships are readable on this repo, discovered by probing. */
export type DependencyMode = 'graphql' | 'rest' | 'label';

export type RawComment = {
	/** REST database id; matches the #issuecomment-<id> URL fragment. */
	id: number;
	url: string;
	createdAt: string;
	body: string;
	authorAssociation: string;
	authorLogin: string;
	authorIsBot: boolean;
};

/**
 * A trust-filtered comment. Untrusted comments keep their metadata so humans
 * can find them, but the body is withheld and never cached or displayed.
 */
export type InboxComment =
	| {
			trusted: true;
			id: number;
			url: string;
			authorLogin: string;
			createdAt: string;
			body: string;
	  }
	| {
			trusted: false;
			id: number;
			url: string;
			authorLogin: string;
			createdAt: string;
	  };

export type LinkedPullRequest = {
	number: number;
	state: 'OPEN' | 'CLOSED' | 'MERGED';
};

export type BlockerRef = {
	number: number;
	state: 'OPEN' | 'CLOSED';
};

/** One issue in the work snapshot, already trust-filtered and status-derived. */
export type WorkIssue = {
	number: number;
	title: string;
	url: string;
	state: 'OPEN' | 'CLOSED';
	stateReason: string | undefined;
	status: WorkStatus;
	type: WorkType | undefined;
	areas: string[];
	phase: number | undefined;
	priority: Priority | undefined;
	assignees: string[];
	authorLogin: string;
	authorAssociation: string;
	/** Login of the last body editor, when GitHub reports one. */
	lastEditedBy: string | undefined;
	/** Body content passes trust (trusted author, member triage, or trusted last editor). */
	bodyTrusted: boolean;
	/** Empty string when bodyTrusted is false. */
	body: string;
	hasWorkMarker: boolean;
	/** Issue carries the full member-applied work shape (type, area, milestone, priority). */
	triaged: boolean;
	createdAt: string;
	updatedAt: string;
	linkedPullRequests: LinkedPullRequest[];
	blockedBy: BlockerRef[];
	comments: InboxComment[];
};

export type WorkSnapshot = {
	fetchedAt: string;
	repo: string;
	viewerLogin: string;
	dependencyMode: DependencyMode;
	issueTypesAvailable: boolean;
	projectNumber: number | undefined;
	issues: WorkIssue[];
};

export type WorkCache = {
	version: 1;
	snapshot: WorkSnapshot;
	/** Per-issue inbox cursor: the createdAt of the newest comment already seen. */
	cursors: Record<string, string>;
};

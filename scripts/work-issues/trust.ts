/**
 * Trust filtering for issue content on a public repo.
 *
 * Only OWNER / MEMBER / COLLABORATOR authors are trusted; everything else
 * (CONTRIBUTOR, FIRST_TIME_CONTRIBUTOR, NONE, bots) is quarantined: metadata
 * survives, content is withheld before it can reach cache, hooks, or agent
 * context. A trusted member can release one quarantined comment by replying
 * `/allow <comment-url-or-id>`; approval is per comment, never blanket.
 */

import type { InboxComment, RawComment } from './types';

const TRUSTED_ASSOCIATIONS = new Set(['OWNER', 'MEMBER', 'COLLABORATOR']);

const ALLOW_DIRECTIVE = /^\/allow\s+(\S+)/gm;
const COMMENT_URL_ID = /#issuecomment-(\d+)\b/;

export function isTrustedAssociation(association: string): boolean {
	return TRUSTED_ASSOCIATIONS.has(association);
}

export function isTrustedAuthor(association: string, isBot: boolean): boolean {
	return !isBot && isTrustedAssociation(association);
}

/**
 * Collects comment ids released via `/allow` directives written by trusted,
 * non-bot authors. Directives from untrusted authors are ignored.
 */
export function collectAllowedCommentIds(
	comments: readonly RawComment[],
): Set<number> {
	const allowed = new Set<number>();
	for (const comment of comments) {
		if (!isTrustedAuthor(comment.authorAssociation, comment.authorIsBot)) {
			continue;
		}
		for (const match of comment.body.matchAll(ALLOW_DIRECTIVE)) {
			const reference = match[1];
			if (reference === undefined) continue;
			const id = parseCommentReference(reference);
			if (id !== undefined) allowed.add(id);
		}
	}
	return allowed;
}

/**
 * Applies the trust filter to a comment list. Trusted (or explicitly allowed)
 * comments keep their body; everything else becomes a metadata-only stub.
 */
export function toInboxComments(
	comments: readonly RawComment[],
): InboxComment[] {
	const allowed = collectAllowedCommentIds(comments);
	return comments.map((comment) => {
		const trusted =
			isTrustedAuthor(comment.authorAssociation, comment.authorIsBot) ||
			allowed.has(comment.id);
		if (trusted) {
			return {
				trusted: true,
				id: comment.id,
				url: comment.url,
				authorLogin: comment.authorLogin,
				createdAt: comment.createdAt,
				body: comment.body,
			};
		}
		return {
			trusted: false,
			id: comment.id,
			url: comment.url,
			authorLogin: comment.authorLogin,
			createdAt: comment.createdAt,
		};
	});
}

function parseCommentReference(reference: string): number | undefined {
	const urlMatch = COMMENT_URL_ID.exec(reference);
	const digits =
		urlMatch?.[1] ?? (/^\d+$/.test(reference) ? reference : undefined);
	if (digits === undefined) return undefined;
	const id = Number.parseInt(digits, 10);
	return Number.isSafeInteger(id) ? id : undefined;
}

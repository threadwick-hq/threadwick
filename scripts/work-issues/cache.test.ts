import { describe, expect, it } from 'vitest';
import { commentsSince, latestTimestamp } from './cache';
import type { InboxComment } from './types';

function trusted(id: number, createdAt: string): InboxComment {
	return {
		trusted: true,
		id,
		url: `https://example.test/#issuecomment-${id}`,
		authorLogin: 'owner',
		createdAt,
		body: `comment ${id}`,
	};
}

const comments: InboxComment[] = [
	trusted(1, '2026-07-01T10:00:00Z'),
	trusted(2, '2026-07-02T10:00:00Z'),
	trusted(3, '2026-07-03T10:00:00Z'),
];

describe('commentsSince', () => {
	it('returns everything when there is no cursor', () => {
		expect(commentsSince(comments, undefined)).toHaveLength(3);
	});

	it('returns only comments strictly newer than the cursor', () => {
		const fresh = commentsSince(comments, '2026-07-02T10:00:00Z');
		expect(fresh.map((comment) => comment.id)).toEqual([3]);
	});

	it('returns nothing when the cursor is at the newest comment', () => {
		expect(commentsSince(comments, '2026-07-03T10:00:00Z')).toHaveLength(0);
	});
});

describe('latestTimestamp', () => {
	it('finds the newest timestamp regardless of order', () => {
		const shuffled = [comments[2], comments[0], comments[1]].filter(
			(comment): comment is InboxComment => comment !== undefined,
		);
		expect(latestTimestamp(shuffled)).toBe('2026-07-03T10:00:00Z');
	});

	it('is undefined for an empty list', () => {
		expect(latestTimestamp([])).toBeUndefined();
	});
});

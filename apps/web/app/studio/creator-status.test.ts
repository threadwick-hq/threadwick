import assert from 'node:assert/strict';
import type {
	Pattern,
	PatternVersion,
	PatternVersionStatus,
	PatternVisibility,
} from '@threadwick/types';
import { describe, test } from 'vitest';
import { isPublishedCreator } from './creator-status';

const NOW = '2026-01-01T00:00:00.000Z';

function version(status: PatternVersionStatus): PatternVersion {
	return {
		id: `ver-${status}`,
		label: 'v1',
		status,
		createdAt: NOW,
		updatedAt: NOW,
	};
}

function makePattern(
	id: string,
	visibility: PatternVisibility | undefined,
	versions: PatternVersion[] = [],
): Pattern {
	return {
		id,
		craft: 'crochet',
		overview: { name: 'Test pattern' },
		components: [],
		materials: [],
		tutorials: [],
		stitches: [],
		notes: [],
		variations: [],
		workingCopy: { branch: 'main', dirty: false },
		versioning:
			visibility === undefined
				? undefined
				: {
						visibility,
						activeVersionId: versions[0]?.id ?? 'ver-draft',
						versions,
					},
	};
}

describe('isPublishedCreator', () => {
	test('an empty library is not a creator', () => {
		assert.equal(isPublishedCreator([]), false);
	});

	test('a pattern with no versioning is not a creator', () => {
		assert.equal(isPublishedCreator([makePattern('p1', undefined)]), false);
	});

	test('a private draft is not a creator', () => {
		const pattern = makePattern('p1', 'private', [version('draft')]);
		assert.equal(isPublishedCreator([pattern]), false);
	});

	// The shipped seed shape: published to the marketplace, but currently mid-draft, so
	// the only versions are `outdated` + `draft` (no `status: 'published'`). It keys off
	// visibility, so this maker is still a creator. Regression guard for the earlier
	// version-status bug.
	test('a published pattern whose versions are outdated + draft is a creator', () => {
		const pattern = makePattern('p1', 'published', [
			version('outdated'),
			version('draft'),
		]);
		assert.equal(isPublishedCreator([pattern]), true);
	});

	test('any published pattern in a mixed library makes a creator', () => {
		const patterns = [
			makePattern('p1', 'private', [version('draft')]),
			makePattern('p2', 'published', [version('published')]),
		];
		assert.equal(isPublishedCreator(patterns), true);
	});
});

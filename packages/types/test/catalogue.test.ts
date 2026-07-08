import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import {
	type CatalogueListing,
	DIFFICULTIES,
	listingMatchesFacets,
} from '../src/catalogue';

const LISTING: CatalogueListing = {
	patternId: 'pat1',
	title: 'Wildflower Granny',
	designer: 'Ada',
	cover: { src: 'blob:cover', alt: '' },
	priceCents: 599,
	currency: 'USD',
	facets: { craft: 'crochet', weight: 'dk', difficulty: 'easy', free: false },
};

describe('catalogue listing', () => {
	test('round-trips losslessly through JSON', () => {
		assert.deepEqual(JSON.parse(JSON.stringify(LISTING)), LISTING);
	});

	test('facet matching requires every SET facet to match', () => {
		assert.equal(listingMatchesFacets(LISTING, {}), true); // no selection
		assert.equal(listingMatchesFacets(LISTING, { craft: 'crochet' }), true);
		assert.equal(listingMatchesFacets(LISTING, { craft: 'knit' }), false);
		assert.equal(
			listingMatchesFacets(LISTING, { craft: 'crochet', weight: 'dk' }),
			true,
		);
		assert.equal(
			listingMatchesFacets(LISTING, { craft: 'crochet', weight: 'aran' }),
			false,
		);
		assert.equal(listingMatchesFacets(LISTING, { free: false }), true);
		assert.equal(listingMatchesFacets(LISTING, { free: true }), false);
	});

	test('the difficulty vocabulary is ordered coarse-to-fine', () => {
		assert.deepEqual(DIFFICULTIES, [
			'beginner',
			'easy',
			'intermediate',
			'advanced',
		]);
	});
});

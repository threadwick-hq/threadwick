import assert from 'node:assert/strict';
import {
	sampleMarketplaceListing,
	sampleMarketplaceViewPattern,
} from '@threadwick/editor/fixtures';
import type { PatternListing } from '@threadwick/editor/follow';
import type { CatalogueListing, Pattern } from '@threadwick/types';
import { describe, test } from 'vitest';
import {
	catalogueFacetOptions,
	followingListings,
	freeListings,
	newListings,
	popularListings,
	queryCatalogue,
	toCatalogueListing,
} from './catalogue-adapter';

describe('toCatalogueListing', () => {
	const pattern = sampleMarketplaceViewPattern();
	const listing = sampleMarketplaceListing();

	test('projects title, designer, price and currency from pattern + listing', () => {
		const result = toCatalogueListing(pattern, listing);
		assert.equal(result.patternId, pattern.id);
		assert.equal(result.title, pattern.overview.name);
		assert.equal(result.designer, listing.handle);
		assert.equal(result.priceCents, listing.priceCents);
		assert.equal(result.currency, listing.currency);
	});

	test('derives free from priceCents <= 0', () => {
		assert.equal(toCatalogueListing(pattern, listing).facets.free, true);
		assert.equal(
			toCatalogueListing(pattern, { ...listing, priceCents: 599 }).facets.free,
			false,
		);
	});

	test('uses the listing category, defaulting to other when absent', () => {
		assert.equal(
			toCatalogueListing(pattern, { ...listing, category: 'garments' }).facets
				.category,
			'garments',
		);
		const withoutCategory: PatternListing = {
			patternId: listing.patternId,
			priceCents: listing.priceCents,
			currency: listing.currency,
		};
		assert.equal(
			toCatalogueListing(pattern, withoutCategory).facets.category,
			'other',
		);
	});

	test('derives the primary yarn weight from the first yarn material, case-insensitively', () => {
		// The sample pattern's yarn material carries weight "DK".
		assert.equal(toCatalogueListing(pattern, listing).facets.weight, 'dk');
	});

	test('omits weight when no material matches a known yarn weight', () => {
		const noWeightPattern: Pattern = {
			...pattern,
			materials: pattern.materials.map((material) =>
				material.kind === 'yarn'
					? { ...material, weight: 'mystery' }
					: material,
			),
		};
		assert.equal(
			toCatalogueListing(noWeightPattern, listing).facets.weight,
			undefined,
		);
	});

	test('includes the pattern cover when present, omits it otherwise', () => {
		const withCover: Pattern = {
			...pattern,
			overview: { ...pattern.overview, cover: { src: 'blob:cover', alt: '' } },
		};
		assert.deepEqual(toCatalogueListing(withCover, listing).cover, {
			src: 'blob:cover',
			alt: '',
		});
		assert.equal(toCatalogueListing(pattern, listing).cover, undefined);
	});
});

const LISTINGS: CatalogueListing[] = [
	{
		patternId: 'p1',
		title: 'Wildflower Granny',
		designer: '@mara_makes',
		priceCents: 0,
		currency: 'USD',
		facets: {
			craft: 'crochet',
			weight: 'dk',
			difficulty: 'easy',
			free: true,
			category: 'blankets',
		},
	},
	{
		patternId: 'p2',
		title: 'Sunset Cardigan',
		designer: '@sky_loom',
		priceCents: 1200,
		currency: 'USD',
		facets: {
			craft: 'knit',
			weight: 'aran',
			difficulty: 'advanced',
			free: false,
			category: 'garments',
		},
	},
	{
		patternId: 'p3',
		title: 'Forest Fox Amigurumi',
		designer: '@tiny_stitch_co',
		priceCents: 0,
		currency: 'USD',
		facets: {
			craft: 'amigurumi',
			weight: 'dk',
			difficulty: 'easy',
			free: true,
			category: 'amigurumi',
		},
	},
	{
		patternId: 'p4',
		title: 'Market Day Tote',
		designer: '@driftwood_designs',
		priceCents: 0,
		currency: 'USD',
		facets: {
			craft: 'crochet',
			weight: 'sport',
			difficulty: 'beginner',
			free: true,
			category: 'home-bags',
		},
	},
	{
		patternId: 'p5',
		title: 'Cloud Nine Cowl',
		designer: '@sky_loom',
		priceCents: 450,
		currency: 'USD',
		facets: {
			craft: 'knit',
			weight: 'bulky',
			difficulty: 'beginner',
			free: false,
			category: 'accessories',
		},
	},
	{
		patternId: 'p6',
		title: 'Tunisian Waves Scarf',
		designer: '@driftwood_designs',
		priceCents: 599,
		currency: 'USD',
		facets: {
			craft: 'tunisian',
			weight: 'fingering',
			difficulty: 'intermediate',
			free: false,
			category: 'accessories',
		},
	},
];

function ids(listings: readonly CatalogueListing[]): string[] {
	return listings.map((listing) => listing.patternId);
}

describe('queryCatalogue', () => {
	test('search matches title case-insensitively', () => {
		assert.deepEqual(ids(queryCatalogue(LISTINGS, { search: 'cardigan' })), [
			'p2',
		]);
		assert.deepEqual(ids(queryCatalogue(LISTINGS, { search: 'CARDIGAN' })), [
			'p2',
		]);
	});

	test('search matches designer case-insensitively', () => {
		assert.deepEqual(
			ids(queryCatalogue(LISTINGS, { search: 'sky_loom' })).sort(),
			['p2', 'p5'],
		);
	});

	test('search with no match returns nothing', () => {
		assert.deepEqual(queryCatalogue(LISTINGS, { search: 'nonexistent' }), []);
	});

	test('filters by craft facet', () => {
		assert.deepEqual(
			ids(queryCatalogue(LISTINGS, { facets: { craft: 'knit' } })).sort(),
			['p2', 'p5'],
		);
	});

	test('filters by weight facet', () => {
		assert.deepEqual(
			ids(queryCatalogue(LISTINGS, { facets: { weight: 'dk' } })).sort(),
			['p1', 'p3'],
		);
	});

	test('filters by difficulty facet', () => {
		assert.deepEqual(
			ids(
				queryCatalogue(LISTINGS, { facets: { difficulty: 'beginner' } }),
			).sort(),
			['p4', 'p5'],
		);
	});

	test('filters by free facet', () => {
		assert.deepEqual(
			ids(queryCatalogue(LISTINGS, { facets: { free: true } })).sort(),
			['p1', 'p3', 'p4'],
		);
	});

	test('filters by category facet', () => {
		assert.deepEqual(
			ids(
				queryCatalogue(LISTINGS, { facets: { category: 'accessories' } }),
			).sort(),
			['p5', 'p6'],
		);
	});

	test('onlyFollowing keeps listings whose designer is followed', () => {
		assert.deepEqual(
			ids(
				queryCatalogue(LISTINGS, {
					onlyFollowing: true,
					followedHandles: ['@sky_loom'],
				}),
			).sort(),
			['p2', 'p5'],
		);
	});

	test('onlyWishlist keeps listings whose patternId is bookmarked', () => {
		assert.deepEqual(
			ids(
				queryCatalogue(LISTINGS, {
					onlyWishlist: true,
					bookmarkedIds: ['p1', 'p6'],
				}),
			).sort(),
			['p1', 'p6'],
		);
	});

	test("sort 'new' preserves input order", () => {
		assert.deepEqual(ids(queryCatalogue(LISTINGS, { sort: 'new' })), [
			'p1',
			'p2',
			'p3',
			'p4',
			'p5',
			'p6',
		]);
	});

	test("sort 'price-low' orders ascending by priceCents", () => {
		assert.deepEqual(ids(queryCatalogue(LISTINGS, { sort: 'price-low' })), [
			'p1',
			'p3',
			'p4',
			'p5',
			'p6',
			'p2',
		]);
	});

	test("sort 'price-high' orders descending by priceCents", () => {
		assert.deepEqual(ids(queryCatalogue(LISTINGS, { sort: 'price-high' })), [
			'p2',
			'p6',
			'p5',
			'p1',
			'p3',
			'p4',
		]);
	});

	test("sort 'popular' ranks free first, then ascending price, then title (and is the default)", () => {
		const expected = ['p3', 'p4', 'p1', 'p5', 'p6', 'p2'];
		assert.deepEqual(
			ids(queryCatalogue(LISTINGS, { sort: 'popular' })),
			expected,
		);
		assert.deepEqual(ids(queryCatalogue(LISTINGS)), expected);
	});
});

describe('curated row selectors', () => {
	test('popularListings sorts by the popular proxy and caps at limit', () => {
		assert.deepEqual(ids(popularListings(LISTINGS)), [
			'p3',
			'p4',
			'p1',
			'p5',
			'p6',
			'p2',
		]);
		assert.deepEqual(ids(popularListings(LISTINGS, 2)), ['p3', 'p4']);
	});

	test('freeListings keeps only free listings, in input order, capped at limit', () => {
		assert.deepEqual(ids(freeListings(LISTINGS)), ['p1', 'p3', 'p4']);
		assert.deepEqual(ids(freeListings(LISTINGS, 2)), ['p1', 'p3']);
	});

	test('newListings uses the new proxy (input order) and caps at limit', () => {
		assert.deepEqual(ids(newListings(LISTINGS, 3)), ['p1', 'p2', 'p3']);
	});

	test('followingListings keeps only followed designers, in input order, capped at limit', () => {
		assert.deepEqual(ids(followingListings(LISTINGS, ['@driftwood_designs'])), [
			'p4',
			'p6',
		]);
		assert.deepEqual(
			ids(followingListings(LISTINGS, ['@driftwood_designs'], 1)),
			['p4'],
		);
	});
});

describe('catalogueFacetOptions', () => {
	test('returns the distinct option sets present, each in a stable order', () => {
		assert.deepEqual(catalogueFacetOptions(LISTINGS), {
			crafts: ['crochet', 'knit', 'amigurumi', 'tunisian'],
			weights: ['fingering', 'sport', 'dk', 'aran', 'bulky'],
			difficulties: ['beginner', 'easy', 'intermediate', 'advanced'],
			categories: [
				'blankets',
				'garments',
				'amigurumi',
				'home-bags',
				'accessories',
			],
		});
	});

	test('returns empty option sets for no listings', () => {
		assert.deepEqual(catalogueFacetOptions([]), {
			crafts: [],
			weights: [],
			difficulties: [],
			categories: [],
		});
	});
});

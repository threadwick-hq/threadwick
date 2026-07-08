import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import {
	type MarketplaceFilters,
	parseMarketplaceFilters,
	serializeMarketplaceFilters,
	toQueryOptions,
} from './marketplace-filters';

describe('parseMarketplaceFilters', () => {
	test('parses every recognized param', () => {
		const params = new URLSearchParams({
			search: 'granny square',
			category: 'blankets',
			weight: 'dk',
			difficulty: 'easy',
			free: '1',
			sort: 'new',
		});
		assert.deepEqual(parseMarketplaceFilters(params), {
			search: 'granny square',
			category: 'blankets',
			weight: 'dk',
			difficulty: 'easy',
			free: true,
			sort: 'new',
		});
	});

	test('returns an empty object for empty params', () => {
		assert.deepEqual(parseMarketplaceFilters(new URLSearchParams()), {});
	});

	test('trims whitespace-only search to absent', () => {
		assert.deepEqual(
			parseMarketplaceFilters(new URLSearchParams({ search: '   ' })),
			{},
		);
	});

	test('ignores an invalid category', () => {
		const params = new URLSearchParams({ category: 'not-a-category' });
		assert.deepEqual(parseMarketplaceFilters(params), {});
	});

	test('ignores an invalid weight', () => {
		const params = new URLSearchParams({ weight: 'chunky-ish' });
		assert.deepEqual(parseMarketplaceFilters(params), {});
	});

	test('ignores an invalid difficulty', () => {
		const params = new URLSearchParams({ difficulty: 'expert' });
		assert.deepEqual(parseMarketplaceFilters(params), {});
	});

	test('ignores an invalid sort and falls back to no sort override', () => {
		const params = new URLSearchParams({ sort: 'trending' });
		assert.deepEqual(parseMarketplaceFilters(params), {});
	});

	test('drops the default sort value rather than carrying it explicitly', () => {
		const params = new URLSearchParams({ sort: 'popular' });
		assert.deepEqual(parseMarketplaceFilters(params), {});
	});

	test('only "free=1" sets the free filter; other values are ignored', () => {
		assert.deepEqual(
			parseMarketplaceFilters(new URLSearchParams({ free: 'true' })),
			{},
		);
		assert.deepEqual(
			parseMarketplaceFilters(new URLSearchParams({ free: '0' })),
			{},
		);
	});

	test('the Yarns deep-link "?weight=dk" parses to a weight filter', () => {
		const params = new URLSearchParams('weight=dk');
		assert.deepEqual(parseMarketplaceFilters(params), { weight: 'dk' });
	});
});

describe('serializeMarketplaceFilters', () => {
	test('omits empty/default fields', () => {
		const params = serializeMarketplaceFilters({});
		assert.equal(params.toString(), '');
	});

	test('omits the default "popular" sort', () => {
		const params = serializeMarketplaceFilters({ sort: 'popular' });
		assert.equal(params.toString(), '');
	});

	test('serializes every set field', () => {
		const filters: MarketplaceFilters = {
			search: 'cardigan',
			category: 'garments',
			weight: 'aran',
			difficulty: 'advanced',
			free: true,
			sort: 'price-low',
		};
		const params = serializeMarketplaceFilters(filters);
		assert.equal(params.get('search'), 'cardigan');
		assert.equal(params.get('category'), 'garments');
		assert.equal(params.get('weight'), 'aran');
		assert.equal(params.get('difficulty'), 'advanced');
		assert.equal(params.get('free'), '1');
		assert.equal(params.get('sort'), 'price-low');
	});

	test('omits free when false', () => {
		const params = serializeMarketplaceFilters({ free: false });
		assert.equal(params.has('free'), false);
	});
});

describe('parse/serialize round-trip', () => {
	test('serializing then parsing recovers the same filters', () => {
		const filters: MarketplaceFilters = {
			search: 'tote',
			category: 'home-bags',
			weight: 'sport',
			difficulty: 'beginner',
			free: true,
			sort: 'price-high',
		};
		const roundTripped = parseMarketplaceFilters(
			serializeMarketplaceFilters(filters),
		);
		assert.deepEqual(roundTripped, filters);
	});

	test('an empty filter set round-trips to an empty filter set', () => {
		assert.deepEqual(
			parseMarketplaceFilters(serializeMarketplaceFilters({})),
			{},
		);
	});
});

describe('toQueryOptions', () => {
	test('maps filters onto facets and defaults sort to popular', () => {
		const options = toQueryOptions({
			search: 'cowl',
			category: 'accessories',
			weight: 'bulky',
			difficulty: 'beginner',
			free: true,
		});
		assert.deepEqual(options, {
			search: 'cowl',
			facets: {
				category: 'accessories',
				weight: 'bulky',
				difficulty: 'beginner',
				free: true,
			},
			sort: 'popular',
		});
	});

	test('omits facets entirely when no facet filter is set', () => {
		const options = toQueryOptions({ search: 'cowl' });
		assert.equal(options.facets, undefined);
	});

	test('preserves an explicit sort', () => {
		const options = toQueryOptions({ sort: 'price-low' });
		assert.equal(options.sort, 'price-low');
	});

	test('folds in preset extras (e.g. onlyFollowing) without touching the URL-derived fields', () => {
		const options = toQueryOptions(
			{ category: 'garments' },
			{ onlyFollowing: true, followedHandles: ['@sky_loom'] },
		);
		assert.equal(options.onlyFollowing, true);
		assert.deepEqual(options.followedHandles, ['@sky_loom']);
		assert.deepEqual(options.facets, { category: 'garments' });
	});
});

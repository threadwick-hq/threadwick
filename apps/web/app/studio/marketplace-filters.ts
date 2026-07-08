// Pure URL <-> filter mapping for the marketplace Browse screen (spec #93). Kept
// free of React/router imports so it stays node-testable and reusable from any
// surface that builds a Browse deep-link (e.g. Yarns' "Find patterns for
// {weight}" link, which lands on `?weight=<YarnWeight>`).

import {
	CATEGORIES,
	DIFFICULTIES,
	type Difficulty,
	type PatternCategory,
	YARN_WEIGHTS,
	type YarnWeight,
} from '@threadwick/types';
import type {
	CatalogueFacetSelection,
	CatalogueQueryOptions,
	CatalogueSort,
} from './catalogue-adapter';

/** The Browse filter state, mirrored 1:1 onto URL search params. */
export type MarketplaceFilters = {
	search?: string;
	category?: PatternCategory;
	weight?: YarnWeight;
	difficulty?: Difficulty;
	free?: boolean;
	sort?: CatalogueSort;
};

/** Preset-driven query options that never appear in the URL — see `toQueryOptions`. */
export type MarketplaceQueryExtra = Partial<
	Pick<
		CatalogueQueryOptions,
		'onlyFollowing' | 'onlyWishlist' | 'followedHandles' | 'bookmarkedIds'
	>
>;

const CATALOGUE_SORTS: readonly CatalogueSort[] = [
	'popular',
	'new',
	'price-low',
	'price-high',
];

const DEFAULT_SORT: CatalogueSort = 'popular';

/**
 * Parses Browse filters from URL search params. Unknown or invalid values
 * (outside the relevant union) are silently ignored rather than surfaced as
 * errors — a stale or hand-edited URL degrades to "no filter", never a crash.
 */
export function parseMarketplaceFilters(
	params: URLSearchParams,
): MarketplaceFilters {
	const filters: MarketplaceFilters = {};

	const search = params.get('search')?.trim();
	if (search) filters.search = search;

	const category = params.get('category');
	if (category !== null && isPatternCategory(category)) {
		filters.category = category;
	}

	const weight = params.get('weight');
	if (weight !== null && isYarnWeight(weight)) filters.weight = weight;

	const difficulty = params.get('difficulty');
	if (difficulty !== null && isDifficulty(difficulty)) {
		filters.difficulty = difficulty;
	}

	if (params.get('free') === '1') filters.free = true;

	const sort = params.get('sort');
	if (sort !== null && isCatalogueSort(sort) && sort !== DEFAULT_SORT) {
		filters.sort = sort;
	}

	return filters;
}

/** Serializes Browse filters into URL search params, omitting empty/default values. */
export function serializeMarketplaceFilters(
	filters: MarketplaceFilters,
): URLSearchParams {
	const params = new URLSearchParams();
	if (filters.search) params.set('search', filters.search);
	if (filters.category !== undefined) params.set('category', filters.category);
	if (filters.weight !== undefined) params.set('weight', filters.weight);
	if (filters.difficulty !== undefined) {
		params.set('difficulty', filters.difficulty);
	}
	if (filters.free === true) params.set('free', '1');
	if (filters.sort !== undefined && filters.sort !== DEFAULT_SORT) {
		params.set('sort', filters.sort);
	}
	return params;
}

/**
 * Maps Browse filters (plus any preset-locked extras — e.g. `onlyFollowing`
 * for the Following preset) to the catalogue adapter's query options.
 */
export function toQueryOptions(
	filters: MarketplaceFilters,
	extra: MarketplaceQueryExtra = {},
): CatalogueQueryOptions {
	const facets: CatalogueFacetSelection = {};
	if (filters.category !== undefined) facets.category = filters.category;
	if (filters.weight !== undefined) facets.weight = filters.weight;
	if (filters.difficulty !== undefined) facets.difficulty = filters.difficulty;
	if (filters.free === true) facets.free = true;

	return {
		search: filters.search,
		facets: Object.keys(facets).length > 0 ? facets : undefined,
		sort: filters.sort ?? DEFAULT_SORT,
		...extra,
	};
}

function isPatternCategory(value: string): value is PatternCategory {
	return CATEGORIES.some((category) => category === value);
}

function isYarnWeight(value: string): value is YarnWeight {
	return YARN_WEIGHTS.some((weight) => weight === value);
}

function isDifficulty(value: string): value is Difficulty {
	return DIFFICULTIES.some((difficulty) => difficulty === value);
}

function isCatalogueSort(value: string): value is CatalogueSort {
	return CATALOGUE_SORTS.some((sort) => sort === value);
}

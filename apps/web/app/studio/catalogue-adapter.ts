// The catalogue adapter (TW-047): projects canonical Pattern + editor
// PatternListing pairs into the browse-layer CatalogueListing (@threadwick/types),
// and offers pure search/filter/sort/curated-row helpers over the projection.
// Only `useCatalogueListings` touches React/the store — everything else is pure
// and node-testable.

import type { PatternListing } from '@threadwick/editor';
import {
	CATEGORIES,
	type CatalogueFacetOptions,
	type CatalogueListing,
	type Craft,
	DIFFICULTIES,
	type Difficulty,
	listingMatchesFacets,
	type Pattern,
	type PatternCategory,
	YARN_WEIGHTS,
	type YarnWeight,
} from '@threadwick/types';
import { CRAFT_TAXONOMY } from './craft-scope';
import {
	getPatternListing,
	useCatalogPatterns,
} from './pattern-ownership-store';

/**
 * Catalogue sort modes. Listings carry no timestamps, so the proxies are
 * deliberately simple and DETERMINISTIC:
 *  - 'new' keeps the input order (fixtures/seed data are appended oldest-first,
 *    so array order is a stable "recently added" proxy).
 *  - 'popular' ranks free listings first, then ascending price, then title —
 *    a stable proxy in the absence of real engagement metrics.
 *  - 'price-low' / 'price-high' sort by priceCents.
 */
export type CatalogueSort = 'popular' | 'new' | 'price-low' | 'price-high';

export type CatalogueFacetSelection = Partial<{
	craft: Craft;
	weight: YarnWeight;
	difficulty: Difficulty;
	free: boolean;
	category: PatternCategory;
}>;

export type CatalogueQueryOptions = {
	/** Case-insensitive substring match over title + designer. */
	search?: string;
	facets?: CatalogueFacetSelection;
	followedHandles?: readonly string[];
	bookmarkedIds?: readonly string[];
	/** Keep only listings whose designer is in `followedHandles`. */
	onlyFollowing?: boolean;
	/** Keep only listings whose patternId is in `bookmarkedIds`. */
	onlyWishlist?: boolean;
	sort?: CatalogueSort;
};

const CURATED_ROW_LIMIT = 8;

/** Projects a canonical Pattern + its editor listing into a browse-catalogue card. */
export function toCatalogueListing(
	pattern: Pattern,
	listing: PatternListing,
): CatalogueListing {
	return {
		patternId: pattern.id,
		title: pattern.overview.name,
		designer: listing.handle,
		cover: pattern.overview.cover,
		priceCents: listing.priceCents,
		currency: listing.currency,
		facets: {
			craft: pattern.craft,
			weight: primaryYarnWeight(pattern),
			difficulty: pattern.overview.skillLevel,
			free: listing.priceCents <= 0,
			category: listing.category ?? 'other',
		},
	};
}

/**
 * Reactive catalogue listings: one card per catalog pattern, projected against
 * that pattern's primary (non-paid) listing. Patterns without a resolvable
 * listing are skipped.
 */
export function useCatalogueListings(): CatalogueListing[] {
	const patterns = useCatalogPatterns();
	return patterns
		.map((pattern) => {
			const listing = getPatternListing(pattern.id);
			return listing === undefined
				? undefined
				: toCatalogueListing(pattern, listing);
		})
		.filter((listing): listing is CatalogueListing => listing !== undefined);
}

/** Pure search/filter/sort over a set of catalogue listings. */
export function queryCatalogue(
	listings: readonly CatalogueListing[],
	options: CatalogueQueryOptions = {},
): CatalogueListing[] {
	const search = normalizeSearch(options.search);
	const followedHandles = options.followedHandles ?? [];
	const bookmarkedIds = options.bookmarkedIds ?? [];

	const filtered = listings.filter((listing) => {
		if (search !== undefined && !matchesSearch(listing, search)) return false;
		if (
			options.facets !== undefined &&
			!listingMatchesFacets(listing, options.facets)
		) {
			return false;
		}
		if (
			options.onlyFollowing === true &&
			!isFollowedListing(listing, followedHandles)
		) {
			return false;
		}
		if (
			options.onlyWishlist === true &&
			!isWishlistedListing(listing, bookmarkedIds)
		) {
			return false;
		}
		return true;
	});

	return sortCatalogue(filtered, options.sort ?? 'popular');
}

/** The most popular listings (see `CatalogueSort` for the proxy), capped at `limit`. */
export function popularListings(
	listings: readonly CatalogueListing[],
	limit = CURATED_ROW_LIMIT,
): CatalogueListing[] {
	return sortCatalogue(listings, 'popular').slice(0, limit);
}

/** Free listings, capped at `limit`. */
export function freeListings(
	listings: readonly CatalogueListing[],
	limit = CURATED_ROW_LIMIT,
): CatalogueListing[] {
	return listings.filter((listing) => listing.facets.free).slice(0, limit);
}

/** The newest listings (see `CatalogueSort` for the proxy), capped at `limit`. */
export function newListings(
	listings: readonly CatalogueListing[],
	limit = CURATED_ROW_LIMIT,
): CatalogueListing[] {
	return sortCatalogue(listings, 'new').slice(0, limit);
}

/** Listings from designers in `followedHandles`, capped at `limit`. */
export function followingListings(
	listings: readonly CatalogueListing[],
	followedHandles: readonly string[],
	limit = CURATED_ROW_LIMIT,
): CatalogueListing[] {
	return listings
		.filter((listing) => isFollowedListing(listing, followedHandles))
		.slice(0, limit);
}

/** The distinct facet option sets present across `listings`, each in a stable order. */
export function catalogueFacetOptions(
	listings: readonly CatalogueListing[],
): CatalogueFacetOptions {
	return {
		crafts: orderedDistinct(
			CRAFT_TAXONOMY,
			listings.map((listing) => listing.facets.craft),
		),
		weights: orderedDistinct(
			YARN_WEIGHTS,
			listings.map((listing) => listing.facets.weight),
		),
		difficulties: orderedDistinct(
			DIFFICULTIES,
			listings.map((listing) => listing.facets.difficulty),
		),
		categories: orderedDistinct(
			CATEGORIES,
			listings.map((listing) => listing.facets.category),
		),
	};
}

/** The primary (first) yarn material's weight, normalized against the YarnWeight vocabulary. */
function primaryYarnWeight(pattern: Pattern): YarnWeight | undefined {
	const yarn = pattern.materials.find((material) => material.kind === 'yarn');
	const raw = yarn?.weight?.trim().toLowerCase();
	if (raw === undefined || raw === '') return undefined;
	return YARN_WEIGHTS.find((weight) => weight === raw);
}

function normalizeSearch(search: string | undefined): string | undefined {
	const trimmed = search?.trim().toLowerCase();
	return trimmed === undefined || trimmed === '' ? undefined : trimmed;
}

function matchesSearch(listing: CatalogueListing, search: string): boolean {
	return (
		listing.title.toLowerCase().includes(search) ||
		(listing.designer?.toLowerCase().includes(search) ?? false)
	);
}

function isFollowedListing(
	listing: CatalogueListing,
	followedHandles: readonly string[],
): boolean {
	return (
		listing.designer !== undefined && followedHandles.includes(listing.designer)
	);
}

function isWishlistedListing(
	listing: CatalogueListing,
	bookmarkedIds: readonly string[],
): boolean {
	return bookmarkedIds.includes(listing.patternId);
}

function sortCatalogue(
	listings: readonly CatalogueListing[],
	sort: CatalogueSort,
): CatalogueListing[] {
	const ordered = [...listings];
	if (sort === 'new') return ordered;
	if (sort === 'price-low') {
		return ordered.sort((a, b) => a.priceCents - b.priceCents);
	}
	if (sort === 'price-high') {
		return ordered.sort((a, b) => b.priceCents - a.priceCents);
	}
	return ordered.sort((a, b) => {
		if (a.facets.free !== b.facets.free) return a.facets.free ? -1 : 1;
		if (a.priceCents !== b.priceCents) return a.priceCents - b.priceCents;
		return a.title.localeCompare(b.title);
	});
}

/** Returns the entries of `order` that appear (defined) in `values`, deduplicated. */
function orderedDistinct<T>(
	order: readonly T[],
	values: readonly (T | undefined)[],
): T[] {
	const present = new Set<T>(
		values.filter((value): value is T => value !== undefined),
	);
	return order.filter((value) => present.has(value));
}

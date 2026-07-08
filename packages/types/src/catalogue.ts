// The marketplace catalogue — the browse layer (spec §8). A CatalogueListing is
// a read-only BROWSE PROJECTION the catalogue adapter (TW-047) assembles from a
// canonical Pattern + its editor PatternListing; it is NOT a stored or competing
// listing model (types is a leaf and cannot import the editor's PatternListing,
// so the browse card carries its own display + facet fields). Facets are the
// filter dimensions the catalogue grid offers.

import type { YarnWeight } from './library';
import type { Craft, ImageRef, SkillLevel } from './pattern';

/** Pattern difficulty — the browse facet is the existing SkillLevel (one name per concept). */
export type Difficulty = SkillLevel;

export const DIFFICULTIES: readonly Difficulty[] = [
	'beginner',
	'easy',
	'intermediate',
	'advanced',
];

/** What kind of thing a pattern is — the browse category facet. */
export type PatternCategory =
	| 'blankets'
	| 'garments'
	| 'amigurumi'
	| 'home-bags'
	| 'accessories'
	| 'other';

export const CATEGORIES = [
	'blankets',
	'garments',
	'amigurumi',
	'home-bags',
	'accessories',
	'other',
] as const satisfies readonly PatternCategory[];

/** The filterable facets a catalogue listing carries. */
export interface ListingFacets {
	craft: Craft;
	weight?: YarnWeight;
	difficulty?: Difficulty;
	/** True for free listings — the "Free" browse filter. */
	free: boolean;
	category: PatternCategory;
}

/** A browse-catalogue card: a projection over a Pattern + its listing, plus facets. */
export interface CatalogueListing {
	patternId: string; // → Pattern.id, the canonical object
	title: string;
	designer?: string;
	cover?: ImageRef;
	priceCents: number;
	currency: string;
	facets: ListingFacets;
}

/** The facet dimensions the catalogue filter UI exposes. */
export interface CatalogueFacetOptions {
	crafts: readonly Craft[];
	weights: readonly YarnWeight[];
	difficulties: readonly Difficulty[];
	categories: readonly PatternCategory[];
}

/** Whether a listing passes an (optional) facet selection — all set facets must match. */
export function listingMatchesFacets(
	listing: CatalogueListing,
	selection: Partial<{
		craft: Craft;
		weight: YarnWeight;
		difficulty: Difficulty;
		free: boolean;
		category: PatternCategory;
	}>,
): boolean {
	if (
		selection.craft !== undefined &&
		listing.facets.craft !== selection.craft
	) {
		return false;
	}
	if (
		selection.weight !== undefined &&
		listing.facets.weight !== selection.weight
	) {
		return false;
	}
	if (
		selection.difficulty !== undefined &&
		listing.facets.difficulty !== selection.difficulty
	) {
		return false;
	}
	if (selection.free !== undefined && listing.facets.free !== selection.free) {
		return false;
	}
	if (
		selection.category !== undefined &&
		listing.facets.category !== selection.category
	) {
		return false;
	}
	return true;
}

// Catalogue browse fixtures — a handful of demo patterns/listings spanning
// several categories, crafts, difficulties, prices and designers, built as
// overrides over the single sample marketplace pattern/listing (@threadwick/editor)
// so every fixture stays shape-valid without hand-authoring a full Pattern each time.

import {
	type PatternListing,
	sampleMarketplaceListing,
	sampleMarketplaceViewPattern,
} from '@threadwick/editor';
import type {
	Craft,
	Pattern,
	PatternCategory,
	SkillLevel,
} from '@threadwick/types';

export type CatalogueFixtureOverrides = {
	id: string;
	name: string;
	craft: Craft;
	skillLevel?: SkillLevel;
	priceCents: number;
	currency?: string;
	handle: string;
	category: PatternCategory;
	/** Overrides the primary yarn material's weight label, e.g. 'worsted', 'dk'. */
	yarnWeight?: string;
};

export type CatalogueFixture = { pattern: Pattern; listing: PatternListing };

/** Builds one catalogue fixture (pattern + listing) as overrides over the sample marketplace pattern. */
export function makeCatalogueFixture(
	overrides: CatalogueFixtureOverrides,
): CatalogueFixture {
	const basePattern = sampleMarketplaceViewPattern();
	const baseListing = sampleMarketplaceListing();

	const pattern: Pattern = {
		...basePattern,
		id: overrides.id,
		craft: overrides.craft,
		overview: {
			...basePattern.overview,
			name: overrides.name,
			skillLevel: overrides.skillLevel ?? basePattern.overview.skillLevel,
		},
		materials:
			overrides.yarnWeight === undefined
				? basePattern.materials
				: basePattern.materials.map((material) =>
						material.kind === 'yarn'
							? { ...material, weight: overrides.yarnWeight }
							: material,
					),
	};

	const listing: PatternListing = {
		...baseListing,
		patternId: overrides.id,
		priceCents: overrides.priceCents,
		currency: overrides.currency ?? baseListing.currency,
		handle: overrides.handle,
		category: overrides.category,
	};

	return { pattern, listing };
}

/**
 * Demo catalogue entries spanning every category and craft, a spread of
 * difficulties, free + paid prices, and several designers — enough variety for
 * the browse grid's facets and curated rows to have something to show.
 */
export const CATALOGUE_FIXTURES: readonly CatalogueFixture[] = [
	makeCatalogueFixture({
		id: 'pat-cozy-cable-throw',
		name: 'Cozy Cable Throw',
		craft: 'crochet',
		skillLevel: 'intermediate',
		priceCents: 799,
		handle: '@mara_makes',
		category: 'blankets',
		yarnWeight: 'worsted',
	}),
	makeCatalogueFixture({
		id: 'pat-sunset-cardigan',
		name: 'Sunset Cardigan',
		craft: 'knit',
		skillLevel: 'advanced',
		priceCents: 1200,
		handle: '@sky_loom',
		category: 'garments',
		yarnWeight: 'aran',
	}),
	makeCatalogueFixture({
		id: 'pat-forest-fox-amigurumi',
		name: 'Forest Fox Amigurumi',
		craft: 'amigurumi',
		skillLevel: 'easy',
		priceCents: 0,
		handle: '@tiny_stitch_co',
		category: 'amigurumi',
		yarnWeight: 'dk',
	}),
	makeCatalogueFixture({
		id: 'pat-market-day-tote',
		name: 'Market Day Tote',
		craft: 'crochet',
		skillLevel: 'beginner',
		priceCents: 0,
		handle: '@driftwood_designs',
		category: 'home-bags',
		yarnWeight: 'sport',
	}),
	makeCatalogueFixture({
		id: 'pat-cloud-nine-cowl',
		name: 'Cloud Nine Cowl',
		craft: 'knit',
		skillLevel: 'beginner',
		priceCents: 450,
		handle: '@sky_loom',
		category: 'accessories',
		yarnWeight: 'bulky',
	}),
	makeCatalogueFixture({
		id: 'pat-tunisian-waves-scarf',
		name: 'Tunisian Waves Scarf',
		craft: 'tunisian',
		skillLevel: 'intermediate',
		priceCents: 599,
		handle: '@driftwood_designs',
		category: 'accessories',
		yarnWeight: 'fingering',
	}),
	makeCatalogueFixture({
		id: 'pat-patchwork-motif-pillow',
		name: 'Patchwork Motif Pillow',
		craft: 'crochet',
		skillLevel: 'easy',
		priceCents: 350,
		handle: '@mara_makes',
		category: 'home-bags',
		yarnWeight: 'dk',
	}),
	makeCatalogueFixture({
		id: 'pat-stitch-sampler-kit',
		name: 'Stitch Sampler Swatch Kit',
		craft: 'other',
		priceCents: 0,
		handle: '@tiny_stitch_co',
		category: 'other',
		yarnWeight: 'super-bulky',
	}),
];

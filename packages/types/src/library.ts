// The Library (spec §7): your collection — a yarn stash, an owned-tools matrix,
// and saved/bought patterns — craft-scoped, drawing on Ravelry metadata. Plain
// JSON-serializable data, designed to round-trip losslessly through export/import
// (the persisted store + its migration land in TW-045). The `ravelry` capability
// flag lives in @threadwick/core; this leaf package only defines the seam + a
// fixture, and the flag-gated live-vs-fixture choice stays with the consuming app.

import type { Craft, ImageRef, PatternOwnership } from './pattern';

// ── Yarn stash ───────────────────────────────────────────────────────────────

/** The standard, filterable yarn weights (Ravelry-aligned), lightest to heaviest. */
export type YarnWeight =
	| 'lace'
	| 'fingering'
	| 'sport'
	| 'dk'
	| 'worsted'
	| 'aran'
	| 'bulky'
	| 'super-bulky'
	| 'jumbo';

/** Optional precise amounts — tracking is a friendly middle, so every field is opt-in. */
export interface YarnQuantity {
	skeins?: number;
	grams?: number;
	yards?: number;
}

export interface StashYarn {
	id: string;
	name: string; // colourway / line display name
	brand?: string;
	weight?: YarnWeight;
	colorway?: string;
	quantity?: YarnQuantity;
	swatch?: ImageRef; // swatch or photo card image
	ravelryYarnId?: string; // decouplable link into the Ravelry yarn DB
}

// ── Owned-tools matrix ───────────────────────────────────────────────────────

export type ToolKind = 'hook' | 'needle';

/** A tap-to-own matrix cell: just kind + size (no material/quantity/brand). */
export interface OwnedTool {
	id: string;
	kind: ToolKind;
	size: string; // canonical mm size, e.g. "4.0 mm" — a cell in the matrix vocabulary
}

/** The crochet hook sizes the matrix offers (mm), smallest to largest. */
export const HOOK_SIZES = [
	'2.0 mm',
	'2.5 mm',
	'3.0 mm',
	'3.5 mm',
	'4.0 mm',
	'4.5 mm',
	'5.0 mm',
	'5.5 mm',
	'6.0 mm',
	'6.5 mm',
	'8.0 mm',
	'9.0 mm',
	'10.0 mm',
] as const;

/** The knitting needle sizes the matrix offers (mm), smallest to largest. */
export const NEEDLE_SIZES = [
	'2.0 mm',
	'2.5 mm',
	'3.0 mm',
	'3.5 mm',
	'4.0 mm',
	'4.5 mm',
	'5.0 mm',
	'5.5 mm',
	'6.0 mm',
	'6.5 mm',
	'8.0 mm',
	'9.0 mm',
	'10.0 mm',
	'12.0 mm',
] as const;

/** The tool sections a craft scope shows: crochet → hooks, knit → needles, else both. */
export function toolMatrixForCraft(
	craft: Craft | 'all',
): { kind: ToolKind; sizes: readonly string[] }[] {
	const hooks = { kind: 'hook' as const, sizes: HOOK_SIZES };
	const needles = { kind: 'needle' as const, sizes: NEEDLE_SIZES };
	if (craft === 'crochet' || craft === 'amigurumi' || craft === 'tunisian') {
		return [hooks];
	}
	if (craft === 'knit') return [needles];
	return [hooks, needles];
}

// ── Saved / bought patterns ──────────────────────────────────────────────────

/** How a Library pattern came to be yours — derived from ownership, never stored twice. */
export type PatternAcquisition = 'saved' | 'free' | 'purchased';

/**
 * A pattern in your Library. Points at the pattern by id and records when it was
 * saved — it does NOT embed the entitlement. `PatternOwnership` stays the single
 * canonical entitlement store (keyed by patternId; see the web pattern-ownership
 * store); the Library screen joins on `patternId` to read ownership/acquisition,
 * so the two never drift (one model, not two).
 */
export interface SavedPattern {
	id: string;
	patternId: string; // → Pattern.id, and the join key into the ownership store
	savedAt: string; // ISO 8601
	ravelryPatternId?: string; // decouplable link into the Ravelry pattern DB
}

/** Derive the acquisition label from the pattern's canonical ownership read-state. */
export function acquisitionFromOwnership(
	ownership: PatternOwnership,
): PatternAcquisition {
	if (!ownership.owned) return 'saved';
	return ownership.purchasedAt ? 'purchased' : 'free';
}

// ── The whole collection ─────────────────────────────────────────────────────

/** The top-level Library shape the persisted store (TW-045) holds. */
export interface Library {
	yarns: StashYarn[];
	tools: OwnedTool[];
	patterns: SavedPattern[];
}

// ── Decouplable Ravelry metadata seam ────────────────────────────────────────

/** The slice of Ravelry yarn metadata the stash draws on (the §0 metadata backbone). */
export interface RavelryYarnMeta {
	ravelryYarnId: string;
	name: string;
	brand?: string;
	weight?: YarnWeight;
}

/**
 * The read seam over Ravelry yarn metadata. Phase 6 ships the fixture below; a
 * live OAuth-backed source drops in later behind the `ravelry` capability flag,
 * chosen by the consuming app — this package stays a leaf.
 */
export interface RavelrySource {
	getYarn(ravelryYarnId: string): RavelryYarnMeta | undefined;
	searchYarns(query: string): RavelryYarnMeta[];
}

const FIXTURE_YARNS: readonly RavelryYarnMeta[] = [
	{
		ravelryYarnId: 'rav-paintbox-cotton-dk',
		name: 'Cotton DK',
		brand: 'Paintbox Yarns',
		weight: 'dk',
	},
	{
		ravelryYarnId: 'rav-drops-safran',
		name: 'Safran',
		brand: 'DROPS',
		weight: 'fingering',
	},
	{
		ravelryYarnId: 'rav-wool-and-the-gang-crazy-sexy-wool',
		name: 'Crazy Sexy Wool',
		brand: 'Wool and the Gang',
		weight: 'jumbo',
	},
];

/** A small in-memory Ravelry source for Phase 6 — never production data. */
export const fixtureRavelrySource: RavelrySource = {
	getYarn(ravelryYarnId) {
		return FIXTURE_YARNS.find((y) => y.ravelryYarnId === ravelryYarnId);
	},
	searchYarns(query) {
		const q = query.trim().toLowerCase();
		if (q === '') return [...FIXTURE_YARNS];
		return FIXTURE_YARNS.filter(
			(y) =>
				y.name.toLowerCase().includes(q) ||
				(y.brand?.toLowerCase().includes(q) ?? false),
		);
	},
};

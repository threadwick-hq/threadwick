import type { PatternOwnership } from '@threadwick/types';
import type { Pattern } from '@threadwick/types';
import {
	type PatternQualityCheck,
	patternQualityChecks,
} from './pattern-versioning';

/** Marketplace listing metadata — not stored on Pattern (§4.4). */
export type PatternListing = {
	patternId: string;
	priceCents: number;
	currency: string;
	rating?: number;
	reviewCount?: number;
	handle?: string;
	followerCount?: number;
};

export type PatternMakerPrimaryAction = 'start-making' | 'buy';

export function formatPatternPrice(listing: Pick<PatternListing, 'priceCents' | 'currency'>): string {
	if (listing.priceCents <= 0) return 'Free';
	const amount = listing.priceCents / 100;
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: listing.currency,
	}).format(amount);
}

/** Primary CTA for makers — Start making when free/owned, Buy when paid and not owned (§4.4). */
export function patternMakerPrimaryAction(
	listing: PatternListing,
	ownership: PatternOwnership,
): PatternMakerPrimaryAction {
	if (listing.priceCents <= 0 || ownership.owned) return 'start-making';
	return 'buy';
}

export function patternMakerPrimaryActionLabel(
	action: PatternMakerPrimaryAction,
	listing: PatternListing,
): string {
	if (action === 'start-making') return 'Start making';
	return `Buy · ${formatPatternPrice(listing)}`;
}

/** View-mode face of quality checks — only items that are included (§4.5). */
export function patternQualityIncluded(pattern: Pattern): PatternQualityCheck[] {
	return patternQualityChecks(pattern).filter((check) => check.present);
}

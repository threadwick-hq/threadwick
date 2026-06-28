import { describe, expect, it } from 'vitest';
import {
	formatPatternPrice,
	patternMakerPrimaryAction,
	patternMakerPrimaryActionLabel,
	patternQualityIncluded,
} from '../src/pattern-view-mode';
import {
	sampleMarketplaceListing,
	sampleMarketplaceViewPattern,
	samplePaidMarketplaceListing,
} from '../src/sample-marketplace-pattern';

describe('formatPatternPrice', () => {
	it('returns Free for zero-cent listings', () => {
		expect(formatPatternPrice(sampleMarketplaceListing())).toBe('Free');
	});

	it('formats paid listings in the listing currency', () => {
		expect(formatPatternPrice(samplePaidMarketplaceListing())).toBe('$5.99');
	});
});

describe('patternMakerPrimaryAction', () => {
	const free = sampleMarketplaceListing();
	const paid = samplePaidMarketplaceListing();

	it('returns start-making for free patterns', () => {
		expect(patternMakerPrimaryAction(free, { owned: false })).toBe('start-making');
	});

	it('returns start-making when owned regardless of price', () => {
		expect(patternMakerPrimaryAction(paid, { owned: true })).toBe('start-making');
	});

	it('returns buy for paid patterns that are not owned', () => {
		expect(patternMakerPrimaryAction(paid, { owned: false })).toBe('buy');
	});
});

describe('patternMakerPrimaryActionLabel', () => {
	it('labels start-making and buy actions', () => {
		expect(patternMakerPrimaryActionLabel('start-making', sampleMarketplaceListing())).toBe(
			'Start making',
		);
		expect(patternMakerPrimaryActionLabel('buy', samplePaidMarketplaceListing())).toBe(
			'Buy · $5.99',
		);
	});
});

describe('patternQualityIncluded', () => {
	it('returns only present quality checks for view mode', () => {
		const included = patternQualityIncluded(sampleMarketplaceViewPattern());
		expect(included.length).toBeGreaterThan(0);
		expect(included.every((check) => check.present)).toBe(true);
		expect(included.some((check) => check.id === 'artifact')).toBe(true);
	});
});

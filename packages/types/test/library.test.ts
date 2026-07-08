import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import {
	acquisitionFromOwnership,
	fixtureRavelrySource,
	type Library,
	type OwnedTool,
	type SavedPattern,
	type StashYarn,
	toolMatrixForCraft,
} from '../src/library';
import type { PatternOwnership } from '../src/pattern';

const YARN: StashYarn = {
	id: 'y1',
	name: 'Cotton DK',
	brand: 'Paintbox Yarns',
	weight: 'dk',
	colorway: 'sage',
	quantity: { skeins: 2, grams: 100 },
	swatch: { src: 'blob:swatch', alt: 'sage cotton' },
	ravelryYarnId: 'rav-paintbox-cotton-dk',
};
const TOOL: OwnedTool = { id: 't1', kind: 'hook', size: '4.0 mm' };
const SAVED: SavedPattern = {
	id: 's1',
	patternId: 'pat1',
	savedAt: '2026-07-08T00:00:00.000Z',
};

describe('Library model', () => {
	test('the whole collection round-trips losslessly through JSON', () => {
		const library: Library = {
			yarns: [YARN],
			tools: [TOOL],
			patterns: [SAVED],
		};
		assert.deepEqual(JSON.parse(JSON.stringify(library)), library);
	});

	test('acquisition derives from the canonical ownership, not stored on SavedPattern', () => {
		const purchased: PatternOwnership = {
			owned: true,
			purchasedAt: '2026-07-01T00:00:00.000Z',
		};
		assert.equal(acquisitionFromOwnership(purchased), 'purchased');
		assert.equal(acquisitionFromOwnership({ owned: true }), 'free');
		assert.equal(acquisitionFromOwnership({ owned: false }), 'saved');
	});

	test('the tool matrix is craft-scoped: hooks / needles / both', () => {
		assert.deepEqual(
			toolMatrixForCraft('crochet').map((s) => s.kind),
			['hook'],
		);
		assert.deepEqual(
			toolMatrixForCraft('knit').map((s) => s.kind),
			['needle'],
		);
		assert.deepEqual(
			toolMatrixForCraft('all').map((s) => s.kind),
			['hook', 'needle'],
		);
		// non-crochet, non-knit crafts still get hooks (amigurumi/tunisian)
		assert.deepEqual(
			toolMatrixForCraft('amigurumi').map((s) => s.kind),
			['hook'],
		);
	});

	test('the fixture Ravelry source resolves a seeded id and misses cleanly', () => {
		const yarn = fixtureRavelrySource.getYarn('rav-drops-safran');
		assert.equal(yarn?.brand, 'DROPS');
		assert.equal(fixtureRavelrySource.getYarn('nope'), undefined);
		assert.equal(fixtureRavelrySource.searchYarns('cotton').length, 1);
		assert.equal(fixtureRavelrySource.searchYarns('').length, 3); // empty query -> all fixtures
	});
});

import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { craftIncludes, ownedCrafts } from './craft-scope';

describe('craft scope', () => {
	test("'all' includes everything", () => {
		assert.equal(craftIncludes('all', ['crochet']), true);
		assert.equal(craftIncludes('all', []), true);
	});

	test('a craft scope includes items carrying that craft', () => {
		assert.equal(craftIncludes('crochet', ['crochet']), true);
		assert.equal(craftIncludes('crochet', ['knit']), false);
	});

	test('multi-craft items appear under any of their crafts (inclusion, not exclusion)', () => {
		assert.equal(craftIncludes('crochet', ['knit', 'crochet']), true);
		assert.equal(craftIncludes('knit', ['knit', 'crochet']), true);
	});

	test('items with no craft information are never hidden', () => {
		assert.equal(craftIncludes('crochet', []), true);
		assert.equal(craftIncludes('crochet', [undefined, undefined]), true);
	});

	test('undefined entries do not satisfy a craft scope by themselves being unknown alongside known crafts', () => {
		assert.equal(craftIncludes('crochet', [undefined, 'knit']), false);
	});

	test('ownedCrafts unions item crafts and added crafts in taxonomy order', () => {
		assert.deepEqual(
			ownedCrafts(['knit', undefined, 'crochet'], ['tunisian']),
			['crochet', 'knit', 'tunisian'],
		);
		assert.deepEqual(ownedCrafts([], []), []);
	});
});

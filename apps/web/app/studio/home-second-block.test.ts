import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { secondBlockMode, shouldShowCreatorTeaser } from './home-second-block';

describe('secondBlockMode', () => {
	test('discovery when the marketplace is on and has suggestions', () => {
		assert.equal(secondBlockMode(true, true), 'discovery');
	});

	test('library peek when the marketplace is on but has no suggestions', () => {
		assert.equal(secondBlockMode(true, false), 'library');
	});

	test('library peek when the marketplace is off, regardless of suggestions', () => {
		assert.equal(secondBlockMode(false, true), 'library');
		assert.equal(secondBlockMode(false, false), 'library');
	});
});

describe('shouldShowCreatorTeaser', () => {
	test('shown only for a published creator with the marketplace on', () => {
		assert.equal(shouldShowCreatorTeaser(true, true), true);
	});

	test('hidden for a non-creator', () => {
		assert.equal(shouldShowCreatorTeaser(true, false), false);
	});

	test('hidden when the marketplace is off, even for a creator (decouple)', () => {
		assert.equal(shouldShowCreatorTeaser(false, true), false);
		assert.equal(shouldShowCreatorTeaser(false, false), false);
	});
});

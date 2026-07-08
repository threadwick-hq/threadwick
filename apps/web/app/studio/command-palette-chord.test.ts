import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { matchesCommandPaletteChord } from './command-palette-chord';

describe('matchesCommandPaletteChord', () => {
	test('cmd+k matches', () => {
		assert.equal(
			matchesCommandPaletteChord({
				metaKey: true,
				ctrlKey: false,
				key: 'k',
				defaultPrevented: false,
			}),
			true,
		);
	});

	test('ctrl+k matches', () => {
		assert.equal(
			matchesCommandPaletteChord({
				metaKey: false,
				ctrlKey: true,
				key: 'k',
				defaultPrevented: false,
			}),
			true,
		);
	});

	test('plain k does not match', () => {
		assert.equal(
			matchesCommandPaletteChord({
				metaKey: false,
				ctrlKey: false,
				key: 'k',
				defaultPrevented: false,
			}),
			false,
		);
	});

	test('cmd+j does not match', () => {
		assert.equal(
			matchesCommandPaletteChord({
				metaKey: true,
				ctrlKey: false,
				key: 'j',
				defaultPrevented: false,
			}),
			false,
		);
	});

	test('an already-handled event does not match', () => {
		assert.equal(
			matchesCommandPaletteChord({
				metaKey: true,
				ctrlKey: false,
				key: 'k',
				defaultPrevented: true,
			}),
			false,
		);
	});

	test('uppercase K matches', () => {
		assert.equal(
			matchesCommandPaletteChord({
				metaKey: true,
				ctrlKey: false,
				key: 'K',
				defaultPrevented: false,
			}),
			true,
		);
	});
});

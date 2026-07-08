import assert from 'node:assert/strict';
import { afterEach, describe, test } from 'vitest';
import {
	getCapabilities,
	isMarketplaceEnabled,
	isRavelryEnabled,
	resetCapabilities,
	setCapabilities,
} from '../src/capabilities';

afterEach(() => {
	resetCapabilities();
});

describe('capability flags', () => {
	test('marketplace defaults on (native); ravelry defaults off', () => {
		assert.equal(isMarketplaceEnabled(), true);
		assert.equal(isRavelryEnabled(), false);
	});

	test('a private/offline build can turn the marketplace off', () => {
		setCapabilities({ marketplace: false });
		assert.equal(isMarketplaceEnabled(), false);
		// other flags are untouched by a partial override
		assert.equal(isRavelryEnabled(), false);
	});

	test('reset restores the native defaults', () => {
		setCapabilities({ marketplace: false, ravelry: true });
		resetCapabilities();
		assert.deepEqual(getCapabilities(), { marketplace: true, ravelry: false });
	});
});

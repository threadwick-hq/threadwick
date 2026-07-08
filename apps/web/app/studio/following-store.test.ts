import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import {
	addFollowedHandle,
	removeFollowedHandle,
	toggleFollowedHandle,
} from './following-store';

const HANDLES = ['@mara_makes', '@sky_loom'];

describe('addFollowedHandle', () => {
	test('adds a handle not already present', () => {
		assert.deepEqual(addFollowedHandle(HANDLES, '@driftwood_designs'), [
			'@mara_makes',
			'@sky_loom',
			'@driftwood_designs',
		]);
	});

	test('is idempotent for an already-followed handle', () => {
		assert.deepEqual(addFollowedHandle(HANDLES, '@mara_makes'), HANDLES);
	});

	test('does not mutate its input', () => {
		const original = [...HANDLES];
		addFollowedHandle(HANDLES, '@driftwood_designs');
		assert.deepEqual(HANDLES, original);
	});
});

describe('removeFollowedHandle', () => {
	test('removes a followed handle', () => {
		assert.deepEqual(removeFollowedHandle(HANDLES, '@mara_makes'), [
			'@sky_loom',
		]);
	});

	test('is a no-op for a handle not followed', () => {
		assert.deepEqual(
			removeFollowedHandle(HANDLES, '@driftwood_designs'),
			HANDLES,
		);
	});

	test('does not mutate its input', () => {
		const original = [...HANDLES];
		removeFollowedHandle(HANDLES, '@mara_makes');
		assert.deepEqual(HANDLES, original);
	});

	test('returns a new array', () => {
		assert.notEqual(removeFollowedHandle(HANDLES, '@mara_makes'), HANDLES);
	});
});

describe('toggleFollowedHandle', () => {
	test('adds an unfollowed handle', () => {
		assert.deepEqual(toggleFollowedHandle(HANDLES, '@driftwood_designs'), [
			'@mara_makes',
			'@sky_loom',
			'@driftwood_designs',
		]);
	});

	test('removes an already-followed handle', () => {
		assert.deepEqual(toggleFollowedHandle(HANDLES, '@sky_loom'), [
			'@mara_makes',
		]);
	});
});

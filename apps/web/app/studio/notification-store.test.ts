import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import {
	filterNotifications,
	markAllRead,
	type StudioNotification,
	unreadCount,
} from './notification-store';

const NOTIFICATIONS: StudioNotification[] = [
	{
		id: 'a',
		category: 'activity',
		title: 'Activity one',
		at: '2026-01-01T00:00:00.000Z',
		read: false,
	},
	{
		id: 'b',
		category: 'activity',
		title: 'Activity two',
		at: '2026-01-02T00:00:00.000Z',
		read: true,
	},
	{
		id: 'c',
		category: 'shop',
		title: 'Shop one',
		at: '2026-01-03T00:00:00.000Z',
		read: false,
	},
];

describe('unreadCount', () => {
	test('counts only unread notifications', () => {
		assert.equal(unreadCount(NOTIFICATIONS), 2);
	});

	test('is zero for an empty list', () => {
		assert.equal(unreadCount([]), 0);
	});
});

describe('filterNotifications', () => {
	test("'all' returns every notification", () => {
		assert.deepEqual(filterNotifications(NOTIFICATIONS, 'all'), NOTIFICATIONS);
	});

	test("'activity' returns only activity notifications", () => {
		assert.deepEqual(filterNotifications(NOTIFICATIONS, 'activity'), [
			NOTIFICATIONS[0],
			NOTIFICATIONS[1],
		]);
	});

	test("'shop' returns only shop notifications", () => {
		assert.deepEqual(filterNotifications(NOTIFICATIONS, 'shop'), [
			NOTIFICATIONS[2],
		]);
	});
});

describe('markAllRead', () => {
	test('sets every notification read', () => {
		const result = markAllRead(NOTIFICATIONS);
		assert.equal(
			result.every((item) => item.read),
			true,
		);
	});

	test('does not mutate its input', () => {
		const original = structuredClone(NOTIFICATIONS);
		markAllRead(NOTIFICATIONS);
		assert.deepEqual(NOTIFICATIONS, original);
	});

	test('returns a new array', () => {
		assert.notEqual(markAllRead(NOTIFICATIONS), NOTIFICATIONS);
	});
});

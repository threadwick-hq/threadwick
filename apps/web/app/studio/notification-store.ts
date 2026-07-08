import { createLocalStore } from '../lib/create-local-store';

export type NotificationCategory = 'activity' | 'shop';

export type StudioNotification = {
	id: string;
	category: NotificationCategory;
	title: string;
	body?: string;
	at: string;
	read: boolean;
};

const STORAGE_KEY = 'threadwick.studio.notifications.v1';

function isStudioNotification(value: unknown): value is StudioNotification {
	if (typeof value !== 'object' || value === null) return false;
	if (!('id' in value) || !('category' in value) || !('title' in value)) {
		return false;
	}
	if (!('at' in value) || !('read' in value)) return false;
	const { id, category, title, at, read } = value;
	return (
		typeof id === 'string' &&
		(category === 'activity' || category === 'shop') &&
		typeof title === 'string' &&
		typeof at === 'string' &&
		typeof read === 'boolean'
	);
}

function isNotificationList(value: unknown): value is StudioNotification[] {
	return Array.isArray(value) && value.every(isStudioNotification);
}

// Deterministic seed fixtures: fixed ids/timestamps (no Date.now/random) so
// server and client render the same snapshot before hydration flips it.
const SEED: StudioNotification[] = [
	{
		id: 'notif-follow-new-pattern',
		category: 'activity',
		title: 'Wildflower Studio published a new pattern',
		body: 'Granny Square Throw is now live.',
		at: '2026-07-06T14:00:00.000Z',
		read: false,
	},
	{
		id: 'notif-project-comment',
		category: 'activity',
		title: 'New comment on your project',
		body: 'Sage left a comment on "Autumn Wrap".',
		at: '2026-07-05T09:30:00.000Z',
		read: false,
	},
	{
		id: 'notif-shop-sale',
		category: 'shop',
		title: 'Weekend sale: 20% off Paintbox Yarns',
		at: '2026-07-04T18:00:00.000Z',
		read: true,
	},
	{
		id: 'notif-shop-wishlist-restock',
		category: 'shop',
		title: 'Back in stock: Safran fingering',
		body: 'An item on your wishlist is available again.',
		at: '2026-07-03T11:15:00.000Z',
		read: false,
	},
	{
		id: 'notif-follow-price-drop',
		category: 'activity',
		title: 'Sky Loom Patterns lowered a price',
		at: '2026-07-01T08:00:00.000Z',
		read: true,
	},
];

const notificationStore = createLocalStore<StudioNotification[]>({
	storageKey: STORAGE_KEY,
	seed: () => structuredClone(SEED),
	isValid: isNotificationList,
});

/** How many notifications are unread — drives the bell's badge count. */
export function unreadCount(items: readonly StudioNotification[]): number {
	return items.filter((item) => !item.read).length;
}

/** Filters notifications by category, or returns them all for `'all'`. */
export function filterNotifications(
	items: readonly StudioNotification[],
	filter: 'all' | NotificationCategory,
): StudioNotification[] {
	if (filter === 'all') return [...items];
	return items.filter((item) => item.category === filter);
}

/** Marks every notification read. Immutable: returns a new array, never mutates `items`. */
export function markAllRead(
	items: readonly StudioNotification[],
): StudioNotification[] {
	return items.map((item) => (item.read ? item : { ...item, read: true }));
}

export { notificationStore };

/** Marks every stored notification read (the inbox's "Mark all read" action). */
export function markAllNotificationsRead(): void {
	notificationStore.update((prev) => markAllRead(prev));
}

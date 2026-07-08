// Followed designers — mirrors bookmarks-store's shape, but the marketplace
// "Following" browse filter needs a list of handles rather than pattern ids, so
// it gets its own keyed store instead of piggybacking on bookmarksStore.

import { sampleMarketplaceListing } from '@threadwick/editor';
import { createLocalStore } from '../lib/create-local-store';

export type FollowingState = { handles: string[] };

const STORAGE_KEY = 'threadwick.marketplace.following.v1';

function isFollowingState(value: unknown): value is FollowingState {
	if (typeof value !== 'object' || value === null) return false;
	if (!('handles' in value)) return false;
	const { handles } = value;
	return (
		Array.isArray(handles) &&
		handles.every((handle) => typeof handle === 'string')
	);
}

/** Seeds following with the sample marketplace designer so the "Following" facet has content. */
function seedHandles(): string[] {
	const handle = sampleMarketplaceListing().handle;
	return handle === undefined ? [] : [handle];
}

const followingStore = createLocalStore<FollowingState>({
	storageKey: STORAGE_KEY,
	seed: () => ({ handles: seedHandles() }),
	isValid: isFollowingState,
});

/** Adds `handle` to `handles` if not already present. Immutable. */
export function addFollowedHandle(handles: string[], handle: string): string[] {
	return handles.includes(handle) ? handles : [...handles, handle];
}

/** Removes `handle` from `handles`. Immutable. */
export function removeFollowedHandle(
	handles: string[],
	handle: string,
): string[] {
	return handles.filter((existing) => existing !== handle);
}

/** Flips `handle`'s membership in `handles`. Immutable. */
export function toggleFollowedHandle(
	handles: string[],
	handle: string,
): string[] {
	return handles.includes(handle)
		? removeFollowedHandle(handles, handle)
		: addFollowedHandle(handles, handle);
}

/** Whether the viewer currently follows `handle`. */
export function isFollowingDesigner(handle: string): boolean {
	return followingStore.getSnapshot().handles.includes(handle);
}

/** Sets whether the viewer follows `handle`. */
export function setFollowingDesigner(handle: string, following: boolean): void {
	followingStore.update((state) => ({
		handles: following
			? addFollowedHandle(state.handles, handle)
			: removeFollowedHandle(state.handles, handle),
	}));
}

/** Toggles whether the viewer follows `handle`. */
export function toggleFollowingDesigner(handle: string): void {
	followingStore.update((state) => ({
		handles: toggleFollowedHandle(state.handles, handle),
	}));
}

/** Subscribe to the viewer's followed-designer handles. */
export function useFollowedDesigners(): string[] {
	return followingStore.use().handles;
}

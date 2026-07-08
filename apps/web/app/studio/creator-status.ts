import type { Pattern } from '@threadwick/types';

/**
 * Whether the maker has published at least one pattern — the signal that switches
 * the notification inbox from a plain maker view to a creator view (adds the Shop
 * filter). Keys off the whole-pattern `visibility` pill, not version status: a
 * pattern stays published to the marketplace even while its newest version is a
 * draft and the previously published one has become `outdated`. Pure and store-free
 * so it stays trivially testable.
 *
 * @param patterns - The workbench pattern library to check.
 * @returns `true` when any pattern is published to the marketplace.
 */
export function isPublishedCreator(patterns: readonly Pattern[]): boolean {
	return patterns.some(
		(pattern) => pattern.versioning?.visibility === 'published',
	);
}

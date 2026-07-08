import type { PatternListing } from '@threadwick/editor';
import {
	sampleMarketplaceListing,
	sampleMarketplaceViewPattern,
	samplePaidMarketplaceListing,
} from '@threadwick/editor';
import type { Pattern, PatternOwnership } from '@threadwick/types';
import { useEffect } from 'react';
import { createLocalStore } from '../lib/create-local-store';
import { getPattern } from './pattern-store';

const CATALOG_KEY = 'threadwick.marketplace.catalog.v1';
const OWNERSHIP_KEY = 'threadwick.marketplace.ownership.v1';
const BOOKMARKS_KEY = 'threadwick.marketplace.bookmarks.v1';

type CatalogState = { patterns: Pattern[]; listings: PatternListing[] };
type OwnershipState = Record<string, PatternOwnership>;

function isCatalogState(value: unknown): value is CatalogState {
	if (typeof value !== 'object' || value === null) return false;
	if (!('patterns' in value) || !('listings' in value)) return false;
	return Array.isArray(value.patterns) && Array.isArray(value.listings);
}

function isOwnershipState(value: unknown): value is OwnershipState {
	return typeof value === 'object' && value !== null;
}

function isBookmarkList(value: unknown): value is string[] {
	return Array.isArray(value);
}

const catalogStore = createLocalStore<CatalogState>({
	storageKey: CATALOG_KEY,
	seed: () => ({ patterns: [], listings: [] }),
	isValid: isCatalogState,
});

const ownershipStore = createLocalStore<OwnershipState>({
	storageKey: OWNERSHIP_KEY,
	seed: () => ({}),
	isValid: isOwnershipState,
});

const bookmarksStore = createLocalStore<string[]>({
	storageKey: BOOKMARKS_KEY,
	seed: () => [],
	isValid: isBookmarkList,
});

function ensureCatalogSeed() {
	if (catalogStore.getSnapshot().patterns.length === 0) {
		catalogStore.update(
			() => ({
				patterns: [sampleMarketplaceViewPattern()],
				listings: [sampleMarketplaceListing(), samplePaidMarketplaceListing()],
			}),
			{ notify: false },
		);
	}
}

export function getCatalogPattern(id: string): Pattern | undefined {
	ensureCatalogSeed();
	return catalogStore
		.getSnapshot()
		.patterns.find((pattern) => pattern.id === id);
}

export function getPatternListing(
	patternId: string,
	options?: { paidDemo?: boolean },
): PatternListing | undefined {
	ensureCatalogSeed();
	if (options?.paidDemo && patternId === 'pat-wildflower-granny') {
		return samplePaidMarketplaceListing();
	}
	return catalogStore
		.getSnapshot()
		.listings.find((listing) => listing.patternId === patternId);
}

export function getPatternOwnership(patternId: string): PatternOwnership {
	ensureCatalogSeed();
	const stored = ownershipStore.getSnapshot()[patternId];
	if (stored) return stored;
	const listing = getPatternListing(patternId);
	if (listing && listing.priceCents <= 0) return { owned: true };
	return { owned: false };
}

export function purchasePattern(patternId: string): PatternOwnership {
	ensureCatalogSeed();
	const next: PatternOwnership = {
		owned: true,
		purchasedAt: new Date().toISOString(),
	};
	ownershipStore.update((ownership) => ({ ...ownership, [patternId]: next }));
	return next;
}

export function isPatternBookmarked(patternId: string): boolean {
	ensureCatalogSeed();
	return bookmarksStore.getSnapshot().includes(patternId);
}

export function setPatternBookmarked(patternId: string, bookmarked: boolean) {
	ensureCatalogSeed();
	bookmarksStore.update((bookmarks) => {
		if (bookmarked) {
			return bookmarks.includes(patternId)
				? bookmarks
				: [...bookmarks, patternId];
		}
		return bookmarks.filter((id) => id !== patternId);
	});
}

/** Resolve a pattern for view mode — catalog first, then workbench library. */
export function resolveViewPattern(patternId: string): Pattern | undefined {
	return getCatalogPattern(patternId) ?? getPattern(patternId);
}

export function usePatternMarketplaceState(): void {
	useEffect(() => {
		ensureCatalogSeed();
	}, []);
	catalogStore.use();
	ownershipStore.use();
	bookmarksStore.use();
}

/**
 * Your Library patterns — saved (bookmarked) ∪ bought (purchased), resolved with
 * their canonical ownership. Derived from the entitlement stores, never a
 * separate SavedPattern store (one model, not two — see #90/#91).
 */
export function useSavedPatterns(): {
	pattern: Pattern;
	ownership: PatternOwnership;
}[] {
	usePatternMarketplaceState();
	const ids = new Set<string>([
		...bookmarksStore.getSnapshot(),
		...Object.keys(ownershipStore.getSnapshot()),
	]);
	const out: { pattern: Pattern; ownership: PatternOwnership }[] = [];
	for (const id of ids) {
		const pattern = resolveViewPattern(id);
		if (pattern) out.push({ pattern, ownership: getPatternOwnership(id) });
	}
	return out;
}

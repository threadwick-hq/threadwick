import type { PatternListing } from '@threadwick/editor';
import {
	sampleMarketplaceListing,
	sampleMarketplaceViewPattern,
	samplePaidMarketplaceListing,
} from '@threadwick/editor';
import type { Pattern, PatternOwnership } from '@threadwick/types';
import { useEffect, useState } from 'react';
import { getPattern } from './pattern-store';

const CATALOG_KEY = 'threadwick.marketplace.catalog.v1';
const OWNERSHIP_KEY = 'threadwick.marketplace.ownership.v1';
const BOOKMARKS_KEY = 'threadwick.marketplace.bookmarks.v1';

type CatalogState = { patterns: Pattern[]; listings: PatternListing[] };
type OwnershipState = Record<string, PatternOwnership>;

function loadCatalog(): CatalogState {
	if (typeof localStorage === 'undefined') {
		return { patterns: [], listings: [] };
	}
	try {
		const raw = localStorage.getItem(CATALOG_KEY);
		if (!raw) return { patterns: [], listings: [] };
		const parsed = JSON.parse(raw) as CatalogState;
		if (!Array.isArray(parsed.patterns) || !Array.isArray(parsed.listings)) {
			return { patterns: [], listings: [] };
		}
		return parsed;
	} catch {
		return { patterns: [], listings: [] };
	}
}

function saveCatalog(state: CatalogState) {
	localStorage.setItem(CATALOG_KEY, JSON.stringify(state));
}

function loadOwnership(): OwnershipState {
	if (typeof localStorage === 'undefined') return {};
	try {
		const raw = localStorage.getItem(OWNERSHIP_KEY);
		if (!raw) return {};
		const parsed = JSON.parse(raw) as OwnershipState;
		return parsed && typeof parsed === 'object' ? parsed : {};
	} catch {
		return {};
	}
}

function saveOwnership(state: OwnershipState) {
	localStorage.setItem(OWNERSHIP_KEY, JSON.stringify(state));
}

function loadBookmarks(): string[] {
	if (typeof localStorage === 'undefined') return [];
	try {
		const raw = localStorage.getItem(BOOKMARKS_KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw) as string[];
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}

function saveBookmarks(ids: string[]) {
	localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(ids));
}

let catalog = loadCatalog();
let ownership = loadOwnership();
let bookmarks = loadBookmarks();
const listeners = new Set<() => void>();

function notify() {
	for (const listener of listeners) listener();
}

function ensureCatalogSeed() {
	if (catalog.patterns.length === 0) {
		catalog = {
			patterns: [sampleMarketplaceViewPattern()],
			listings: [sampleMarketplaceListing(), samplePaidMarketplaceListing()],
		};
		saveCatalog(catalog);
	}
}

export function getCatalogPattern(id: string): Pattern | undefined {
	ensureCatalogSeed();
	return catalog.patterns.find((pattern) => pattern.id === id);
}

export function getPatternListing(
	patternId: string,
	options?: { paidDemo?: boolean },
): PatternListing | undefined {
	ensureCatalogSeed();
	if (options?.paidDemo && patternId === 'pat-wildflower-granny') {
		return samplePaidMarketplaceListing();
	}
	return catalog.listings.find((listing) => listing.patternId === patternId);
}

export function getPatternOwnership(patternId: string): PatternOwnership {
	ensureCatalogSeed();
	const stored = ownership[patternId];
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
	ownership = { ...ownership, [patternId]: next };
	saveOwnership(ownership);
	notify();
	return next;
}

export function isPatternBookmarked(patternId: string): boolean {
	ensureCatalogSeed();
	return bookmarks.includes(patternId);
}

export function setPatternBookmarked(patternId: string, bookmarked: boolean) {
	ensureCatalogSeed();
	if (bookmarked) {
		if (!bookmarks.includes(patternId)) bookmarks = [...bookmarks, patternId];
	} else {
		bookmarks = bookmarks.filter((id) => id !== patternId);
	}
	saveBookmarks(bookmarks);
	notify();
}

/** Resolve a pattern for view mode — catalog first, then workbench library. */
export function resolveViewPattern(patternId: string): Pattern | undefined {
	return getCatalogPattern(patternId) ?? getPattern(patternId);
}

export function usePatternMarketplaceState(): void {
	const [, bump] = useState(0);
	useEffect(() => {
		ensureCatalogSeed();
		const listener = () => bump((n) => n + 1);
		listeners.add(listener);
		return () => {
			listeners.delete(listener);
		};
	}, []);
}

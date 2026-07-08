import type { OwnedTool, StashYarn, ToolKind } from '@threadwick/types';
import { createLocalStore } from '../lib/create-local-store';

// The Library's genuinely-owned data — the yarn stash and the owned-tools
// matrix. Saved/bought PATTERNS are NOT stored here: they derive from the
// existing marketplace ownership + bookmark stores (join by patternId), so the
// entitlement stays single-sourced (one model, not two — see #90). Its own key,
// so no chart-project FILE_VERSION bump; plain JSON, lossless round-trip.
export type LibraryStash = {
	yarns: StashYarn[];
	tools: OwnedTool[];
};

const STORAGE_KEY = 'threadwick.studio.library.v1';

function isLibraryStash(value: unknown): value is LibraryStash {
	if (typeof value !== 'object' || value === null) return false;
	if (!('yarns' in value) || !('tools' in value)) return false;
	return Array.isArray(value.yarns) && Array.isArray(value.tools);
}

const SEED: LibraryStash = {
	yarns: [
		{
			id: 'stash-cotton-dk',
			name: 'Cotton DK',
			brand: 'Paintbox Yarns',
			weight: 'dk',
			colorway: 'Sage Green',
			quantity: { skeins: 4 },
			ravelryYarnId: 'rav-paintbox-cotton-dk',
		},
		{
			id: 'stash-safran',
			name: 'Safran',
			brand: 'DROPS',
			weight: 'fingering',
			colorway: 'Off White',
			ravelryYarnId: 'rav-drops-safran',
		},
	],
	tools: [
		{ id: 'tool-hook-40', kind: 'hook', size: '4.0 mm' },
		{ id: 'tool-hook-50', kind: 'hook', size: '5.0 mm' },
	],
};

// The seed factory runs only on first load (no valid stored value); a stash the
// user has emptied deliberately stays empty — no re-seed on next mount.
const libraryStore = createLocalStore<LibraryStash>({
	storageKey: STORAGE_KEY,
	seed: () => structuredClone(SEED),
	isValid: isLibraryStash,
});

// ---- yarns -----------------------------------------------------------------

export function addYarn(yarn: StashYarn): void {
	libraryStore.update((lib) => ({ ...lib, yarns: [...lib.yarns, yarn] }));
}

export function removeYarn(id: string): void {
	libraryStore.update((lib) => ({
		...lib,
		yarns: lib.yarns.filter((y) => y.id !== id),
	}));
}

/** Friendly-middle tracking: set (or clear) the optional precise quantity. */
export function updateYarnQuantity(
	id: string,
	quantity: StashYarn['quantity'],
): void {
	libraryStore.update((lib) => ({
		...lib,
		yarns: lib.yarns.map((y) => (y.id === id ? { ...y, quantity } : y)),
	}));
}

// ---- tools (tap-to-own) ----------------------------------------------------

export function isToolOwned(kind: ToolKind, size: string): boolean {
	return libraryStore
		.getSnapshot()
		.tools.some((t) => t.kind === kind && t.size === size);
}

/** Tap-to-own: toggle a matrix cell (idempotent add/remove). */
export function toggleTool(kind: ToolKind, size: string): void {
	libraryStore.update((lib) => {
		const owned = lib.tools.some((t) => t.kind === kind && t.size === size);
		return {
			...lib,
			tools: owned
				? lib.tools.filter((t) => !(t.kind === kind && t.size === size))
				: [...lib.tools, { id: `tool-${kind}-${size}`, kind, size }],
		};
	});
}

// ---- hooks / selectors -----------------------------------------------------

export function useStashYarns(): StashYarn[] {
	return libraryStore.use().yarns;
}

/** The owned-tools set — the seam the project tool picker's owned-only filter reads. */
export function useOwnedTools(): OwnedTool[] {
	return libraryStore.use().tools;
}

export function useLibraryCounts(): {
	yarns: number;
	tools: number;
} {
	const lib = libraryStore.use();
	return { yarns: lib.yarns.length, tools: lib.tools.length };
}

import type { Project } from '@threadwick/editor/chart';
import type { Craft, Pattern } from '@threadwick/types';
import { createLocalStore } from '../lib/create-local-store';

export type CraftScope = Craft | 'all';

type CraftScopeState = {
	scope: CraftScope;
	/** Crafts added via "+ add craft" that no item carries yet. */
	addedCrafts: Craft[];
};

// The fixed taxonomy, in display order (mirrors @threadwick/types Craft).
export const CRAFT_TAXONOMY: readonly Craft[] = [
	'crochet',
	'knit',
	'amigurumi',
	'tunisian',
	'other',
];

const CRAFT_LABEL: Record<Craft, string> = {
	crochet: 'Crochet',
	knit: 'Knitting',
	amigurumi: 'Amigurumi',
	tunisian: 'Tunisian crochet',
	other: 'Other crafts',
};

// Its own key, deliberately outside the project store: scoping is viewer
// state, and it must never force a FILE_VERSION bump.
const STORAGE_KEY = 'threadwick.studio.craft-scope.v1';

const craftScopeStore = createLocalStore<CraftScopeState>({
	storageKey: STORAGE_KEY,
	seed: () => ({ scope: 'all', addedCrafts: [] }),
	isValid: isCraftScopeState,
});

/** Subscribe to the studio-wide craft scope. */
export function useCraftScope(): CraftScopeState {
	return craftScopeStore.use();
}

export function setCraftScope(scope: CraftScope): void {
	craftScopeStore.update((state) => ({ ...state, scope }));
}

/** "+ add craft": remember a craft the user works with before any item carries it. */
export function addCraft(craft: Craft): void {
	craftScopeStore.update((state) =>
		state.addedCrafts.includes(craft)
			? state
			: { ...state, addedCrafts: [...state.addedCrafts, craft] },
	);
}

export function craftLabel(scope: CraftScope): string {
	return scope === 'all' ? 'All my crafts' : CRAFT_LABEL[scope];
}

/**
 * Inclusion semantics (spec §2): scoping never hides what is reachable.
 * 'all' includes everything; a craft scope includes any item that carries
 * that craft — and any item that carries no craft information at all.
 */
export function craftIncludes(
	scope: CraftScope,
	crafts: readonly (Craft | undefined)[],
): boolean {
	if (scope === 'all') return true;
	// Deliberate: an item is judged by its KNOWN crafts only. Benefit of the
	// doubt applies when nothing is known; a partially-known item that matches
	// no known craft is scoped out (search remains the spec's escape hatch).
	const known = crafts.filter((craft): craft is Craft => craft !== undefined);
	if (known.length === 0) return true;
	return known.includes(scope);
}

/**
 * The crafts you work with: everything your items carry plus the ones added
 * explicitly, in taxonomy order.
 */
export function ownedCrafts(
	itemCrafts: readonly (Craft | undefined)[],
	addedCrafts: readonly Craft[],
): Craft[] {
	const present = new Set<Craft>(addedCrafts);
	for (const craft of itemCrafts) {
		if (craft !== undefined) present.add(craft);
	}
	return CRAFT_TAXONOMY.filter((craft) => present.has(craft));
}

/** Inclusion filter for a workbench pattern. */
export function patternInScope(scope: CraftScope, pattern: Pattern): boolean {
	return craftIncludes(scope, [pattern.craft]);
}

/** Inclusion filter for a make — its crafts live on the pattern refs. */
export function projectInScope(scope: CraftScope, project: Project): boolean {
	return craftIncludes(
		scope,
		(project.makePatterns ?? []).map((ref) => ref.craft),
	);
}

function isCraftScopeState(value: unknown): value is CraftScopeState {
	if (typeof value !== 'object' || value === null) return false;
	if (!('scope' in value) || !('addedCrafts' in value)) return false;
	const { scope, addedCrafts } = value;
	const isCraft = (candidate: unknown): candidate is Craft =>
		typeof candidate === 'string' &&
		CRAFT_TAXONOMY.some((craft) => craft === candidate);
	if (scope !== 'all' && !isCraft(scope)) return false;
	return Array.isArray(addedCrafts) && addedCrafts.every(isCraft);
}

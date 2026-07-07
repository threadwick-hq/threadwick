import {
	createPatternDraft,
	publishPatternVersion,
	remixPattern,
	sampleWorkbenchPattern,
	setActivePatternVersion,
} from '@threadwick/editor';
import type { Pattern } from '@threadwick/types';
import { useEffect } from 'react';
import { createLocalStore } from '../lib/create-local-store';

const STORAGE_KEY = 'threadwick.workbench.patterns.v1';

type PatternLibrary = { patterns: Pattern[] };

function isPatternLibrary(value: unknown): value is PatternLibrary {
	if (typeof value !== 'object' || value === null) return false;
	if (!('patterns' in value)) return false;
	return Array.isArray(value.patterns);
}

const patternLibraryStore = createLocalStore<PatternLibrary>({
	storageKey: STORAGE_KEY,
	seed: () => ({ patterns: [] }),
	isValid: isPatternLibrary,
});

function ensureSeed() {
	if (patternLibraryStore.getSnapshot().patterns.length === 0) {
		patternLibraryStore.update(
			() => ({ patterns: [sampleWorkbenchPattern()] }),
			{ notify: false },
		);
	}
}

export function getPattern(id: string): Pattern | undefined {
	ensureSeed();
	return patternLibraryStore
		.getSnapshot()
		.patterns.find((pattern) => pattern.id === id);
}

export function updatePattern(id: string, patch: Partial<Omit<Pattern, 'id'>>) {
	ensureSeed();
	const existing = patternLibraryStore
		.getSnapshot()
		.patterns.find((pattern) => pattern.id === id);
	if (!existing) return;
	patternLibraryStore.update((library) => ({
		patterns: library.patterns.map((pattern) =>
			pattern.id === id ? { ...existing, ...patch, id: existing.id } : pattern,
		),
	}));
}

export function updatePatternOverview(
	id: string,
	patch: Partial<Pattern['overview']>,
) {
	const pattern = getPattern(id);
	if (!pattern) return;
	updatePattern(id, { overview: { ...pattern.overview, ...patch } });
}

export function setPatternActiveVersion(id: string, versionId: string) {
	const pattern = getPattern(id);
	if (!pattern) return;
	updatePattern(id, setActivePatternVersion(pattern, versionId));
}

export function publishPattern(id: string) {
	const pattern = getPattern(id);
	if (!pattern) return;
	updatePattern(id, publishPatternVersion(pattern));
}

export function startPatternDraft(id: string) {
	const pattern = getPattern(id);
	if (!pattern) return;
	updatePattern(id, createPatternDraft(pattern));
}

function addRemixedPattern(remixed: Pattern): Pattern {
	patternLibraryStore.update((library) => ({
		patterns: [...library.patterns, remixed],
	}));
	return remixed;
}

export function remixWorkbenchPattern(id: string): Pattern | undefined {
	const pattern = getPattern(id);
	if (!pattern) return undefined;
	return addRemixedPattern(remixPattern(pattern));
}

export function remixCatalogPattern(catalogPattern: Pattern): Pattern {
	return addRemixedPattern(remixPattern(catalogPattern));
}

/** Subscribe to workbench pattern library changes. */
export function usePatternLibrary(): Pattern[] {
	useEffect(() => {
		ensureSeed();
	}, []);
	return patternLibraryStore.use().patterns;
}

export function usePattern(id: string | undefined): Pattern | undefined {
	usePatternLibrary();
	if (!id) return undefined;
	return getPattern(id);
}

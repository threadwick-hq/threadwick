import {
	createPatternDraft,
	publishPatternVersion,
	remixPattern,
	sampleWorkbenchPattern,
	setActivePatternVersion,
} from '@threadwick/editor';
import type { Pattern } from '@threadwick/types';
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'threadwick.workbench.patterns.v1';

type PatternLibrary = { patterns: Pattern[] };

function loadPatterns(): PatternLibrary {
	if (typeof localStorage === 'undefined') return { patterns: [] };
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return { patterns: [] };
		const parsed = JSON.parse(raw) as PatternLibrary;
		if (!parsed?.patterns || !Array.isArray(parsed.patterns)) return { patterns: [] };
		return parsed;
	} catch {
		return { patterns: [] };
	}
}

function savePatterns(library: PatternLibrary) {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
}

let library = loadPatterns();
const listeners = new Set<() => void>();

function notify() {
	for (const listener of listeners) listener();
}

function ensureSeed() {
	if (library.patterns.length === 0) {
		library = { patterns: [sampleWorkbenchPattern()] };
		savePatterns(library);
	}
}

export function getPattern(id: string): Pattern | undefined {
	ensureSeed();
	return library.patterns.find((p) => p.id === id);
}

export function updatePattern(id: string, patch: Partial<Omit<Pattern, 'id'>>) {
	ensureSeed();
	const index = library.patterns.findIndex((p) => p.id === id);
	if (index < 0) return;
	const current = library.patterns[index];
	if (!current) return;
	library.patterns[index] = { ...current, ...patch, id: current.id };
	savePatterns(library);
	notify();
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

export function remixWorkbenchPattern(id: string): Pattern | undefined {
	const pattern = getPattern(id);
	if (!pattern) return undefined;
	const remixed = remixPattern(pattern);
	library = { patterns: [...library.patterns, remixed] };
	savePatterns(library);
	notify();
	return remixed;
}

/** Subscribe to workbench pattern library changes. */
export function usePatternLibrary(): Pattern[] {
	const [, bump] = useState(0);
	useEffect(() => {
		ensureSeed();
		const listener = () => bump((n) => n + 1);
		listeners.add(listener);
		return () => {
			listeners.delete(listener);
		};
	}, []);
	return library.patterns;
}

export function usePattern(id: string | undefined): Pattern | undefined {
	usePatternLibrary();
	if (!id) return undefined;
	return getPattern(id);
}

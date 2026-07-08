// The storage codec — the one seam between the in-memory model and every
// persisted shape (localStorage library envelope, exported project file). The
// `any`-typed normalizers in ./model are the private implementation; this
// module is the typed `unknown ->` boundary the store and files I/O go through,
// and the single place Phase 7's unified model will plug in.

import {
	FILE_FORMAT,
	FILE_VERSION,
	normalizeProject,
	projectFromFile,
	projectToFile,
} from './model';
import type { Project, ProjectFile, UIView } from './types';

const UI_VIEWS: readonly UIView[] = ['projects', 'project', 'editor'];

/** The UI route as persisted — a plain, referentially-unvalidated hint. */
export interface StoredUI {
	view: UIView;
	projectId: string | null;
	patternId: string | null;
}

/** The localStorage envelope: the whole library plus the last UI route. */
export interface StoredLibrary {
	format: string;
	version: number;
	library: { projects: Project[] };
	ui: StoredUI;
}

// ---- single project --------------------------------------------------------

/** Parse one untrusted project object into a valid current-shape Project. */
export function parseProject(data: unknown): Project {
	return normalizeProject(data);
}

// ---- exported project file -------------------------------------------------

/** Serialize a project into the exportable file envelope. */
export function serializeProjectFile(project: Project): ProjectFile {
	return projectToFile(project);
}

/**
 * Parse an exported project file. Pre-release: only the current-version
 * envelope is accepted (retired versions and bare projects return null).
 */
export function parseProjectFile(data: unknown): Project | null {
	return projectFromFile(data);
}

// ---- localStorage library envelope -----------------------------------------

/** Serialize the whole library + UI route into the localStorage envelope. */
export function serializeStoredLibrary(
	projects: readonly Project[],
	ui: StoredUI,
): StoredLibrary {
	return {
		format: FILE_FORMAT,
		version: FILE_VERSION,
		library: { projects: [...projects] },
		ui: { view: ui.view, projectId: ui.projectId, patternId: ui.patternId },
	};
}

/**
 * Parse the localStorage envelope into a validated library + UI hint, or null.
 * Pre-release: a missing/stale `version` bails to null (the caller falls back
 * to a fresh seed) rather than mangling a retired shape. Referential checks —
 * whether the stored project/pattern still exist — stay with the caller; this
 * only validates shape.
 */
export function parseStoredLibrary(
	data: unknown,
): { projects: Project[]; ui: StoredUI } | null {
	if (!data || typeof data !== 'object') return null;
	const rec = data as Record<string, unknown>;
	if (rec.version !== FILE_VERSION) return null;
	const library = rec.library;
	if (!library || typeof library !== 'object') return null;
	const rawProjects = (library as Record<string, unknown>).projects;
	if (!Array.isArray(rawProjects)) return null;
	return {
		projects: rawProjects.map(parseProject),
		ui: parseStoredUI(rec.ui),
	};
}

function parseStoredUI(data: unknown): StoredUI {
	const rec =
		data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
	const view = UI_VIEWS.find((v) => v === rec.view) ?? 'projects';
	return {
		view,
		projectId: typeof rec.projectId === 'string' ? rec.projectId : null,
		patternId: typeof rec.patternId === 'string' ? rec.patternId : null,
	};
}

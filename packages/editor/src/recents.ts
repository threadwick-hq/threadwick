import type { Pattern } from '@threadwick/types';
import {
	deriveLastWorkedAt,
	formatRelativeAgoSentence,
} from './project-overview';
import type { Project } from './types';

export type RecentKind = 'pattern' | 'project';

export type RecentItem = {
	kind: RecentKind;
	id: string;
	title: string;
	/** ISO timestamp of the activity the state describes. */
	at: string;
	/** Plain-language state, e.g. "Edited 9 hours ago" / "Worked on 2 days ago". */
	state: string;
};

export type RecentsModel = {
	/** The single most-recent active thing — the Home "Continue" lead card. */
	lead: RecentItem | undefined;
	/** The recents shelf below the lead, most recent first. */
	shelf: RecentItem[];
};

const DEFAULT_SHELF_SIZE = 6;

// The spec's verbs (§3): editing a pattern = designing; touching a project =
// making. A 'saved' kind joins when the Library model lands (TW-044).
const STATE_VERB: Record<RecentKind, string> = {
	pattern: 'Edited',
	project: 'Worked on',
};

/**
 * Derive the Home "Continue" read model over the two top-level collections.
 * Pure: time is injectable via `options.now`.
 *
 * @param patterns workbench patterns; activity = the newest version edit
 * @param projects makes; activity = last worked (falling back to last edit)
 * @param options `now` (ms epoch, default Date.now) and `shelfSize` (default 6)
 * @returns the lead recent plus the shelf, most recent first
 */
export function deriveRecents(
	patterns: readonly Pattern[],
	projects: readonly Project[],
	options: { now?: number; shelfSize?: number } = {},
): RecentsModel {
	const now = options.now ?? Date.now();
	const shelfSize = options.shelfSize ?? DEFAULT_SHELF_SIZE;

	const candidates = [
		...patterns.map((pattern) =>
			toRecent(
				'pattern',
				pattern.id,
				pattern.overview.name,
				patternEditedAt(pattern),
				now,
			),
		),
		...projects.map((project) =>
			toRecent(
				'project',
				project.id,
				project.name,
				deriveLastWorkedAt(project) ?? project.updatedAt,
				now,
			),
		),
	];
	const items = candidates
		.filter(
			(item): item is RecentItem & { parsed: number } => item !== undefined,
		)
		.sort((a, b) => b.parsed - a.parsed)
		.map(({ parsed: _parsed, ...item }) => item);

	return { lead: items[0], shelf: items.slice(1, 1 + shelfSize) };
}

/** The newest version-edit timestamp; undefined when no version carries a valid one. */
export function patternEditedAt(pattern: Pattern): string | undefined {
	let best: string | undefined;
	let bestParsed = Number.NEGATIVE_INFINITY;
	for (const version of pattern.versioning?.versions ?? []) {
		const parsed = Date.parse(version.updatedAt);
		if (!Number.isNaN(parsed) && parsed > bestParsed) {
			best = version.updatedAt;
			bestParsed = parsed;
		}
	}
	return best;
}

function toRecent(
	kind: RecentKind,
	id: string,
	title: string,
	at: string | undefined,
	now: number,
): (RecentItem & { parsed: number }) | undefined {
	if (at === undefined) return undefined;
	const parsed = Date.parse(at);
	if (Number.isNaN(parsed)) return undefined;
	const state = `${STATE_VERB[kind]} ${formatRelativeAgoSentence(at, now)}`;
	return { kind, id, title, at, state, parsed };
}

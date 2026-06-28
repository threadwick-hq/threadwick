// External-pattern Follow fallback: plain round checklist + open source (TW-032).
// Pure — no DOM.

import type {
	ExternalPatternReference,
	PatternProgress,
	PatternReference,
} from '@threadwick/types';

import type { CounterPill, FollowSection } from './follow-ui';
import { followActionLabel, followProgressPercent } from './follow-ui';
import { nowISO } from './util';

const ROUND_PREFIX = 'external:round:';

export function isExternalRef(
	ref: PatternReference,
): ref is ExternalPatternReference {
	return ref.source !== 'threadwick';
}

export function hasStructuredChartData(ref: PatternReference): boolean {
	return ref.source === 'threadwick';
}

export function externalRoundAddress(index: number): string {
	return `${ROUND_PREFIX}${index}`;
}

/** Resolve the href for an external pattern (Ravelry, blog, or uploaded PDF). */
export function externalSourceHref(
	ref: ExternalPatternReference,
): string | undefined {
	if (typeof ref.url === 'string' && ref.url.length > 0) return ref.url;
	if (typeof ref.file?.src === 'string' && ref.file.src.length > 0) {
		return ref.file.src;
	}
	return undefined;
}

export function externalSourceLabel(ref: ExternalPatternReference): string {
	switch (ref.source) {
		case 'ravelry':
			return 'Open on Ravelry';
		case 'pdf':
			return 'Open PDF';
		default:
			return 'Open pattern';
	}
}

function withTimestamp(progress: PatternProgress): PatternProgress {
	return { ...progress, updatedAt: nowISO() };
}

/** Advance one checklist round for an external pattern. */
export function advanceExternalProgress(
	progress: PatternProgress | undefined,
): PatternProgress {
	if (progress?.completed) return progress;
	const done = progress?.unitsDone ?? 0;
	const nextDone = done + 1;
	return withTimestamp({
		unitsDone: nextDone,
		unitsTotal: nextDone + 1,
		cursor: {
			unitAddress: externalRoundAddress(nextDone),
			followMode: 'checklist',
		},
		completed: false,
	});
}

/** Undo one checklist round. */
export function undoExternalProgress(
	progress: PatternProgress | undefined,
): PatternProgress {
	if (!progress || progress.unitsDone <= 0) {
		return progress ?? { unitsDone: 0, unitsTotal: 1 };
	}
	const nextDone = progress.unitsDone - 1;
	if (nextDone <= 0) {
		return withTimestamp({
			unitsDone: 0,
			unitsTotal: 1,
			completed: false,
		});
	}
	return withTimestamp({
		unitsDone: nextDone,
		unitsTotal: nextDone + 1,
		completed: false,
		cursor: {
			unitAddress: externalRoundAddress(nextDone),
			followMode: 'checklist',
		},
	});
}

/** Mark an external pattern ref finished (explicit done signal). */
export function completeExternalProgress(
	progress: PatternProgress | undefined,
): PatternProgress {
	const done = progress?.unitsDone ?? 0;
	const total = Math.max(done, 1);
	return withTimestamp({
		unitsDone: done,
		unitsTotal: total,
		completed: true,
		cursor: progress?.cursor,
	});
}

export function deriveExternalCounterPills(
	progress: PatternProgress | undefined,
): CounterPill[] {
	if (progress?.completed) return [];
	const done = progress?.unitsDone ?? 0;
	const current = done + 1;
	return [
		{
			icon: 'round',
			label: 'Round',
			value: `${current}`,
		},
	];
}

export function deriveExternalChecklistSections(
	progress: PatternProgress | undefined,
): FollowSection[] {
	const unitsDone = progress?.unitsDone ?? 0;
	const completed = progress?.completed === true;
	const sections: FollowSection[] = [];

	for (let i = 0; i < unitsDone; i++) {
		sections.push({
			id: 'round',
			title: `Round ${i + 1}`,
			subtitle: 'Done',
			instructionLine: `Round ${i + 1} complete.`,
			done: true,
			open: false,
		});
	}

	if (!completed) {
		sections.push({
			id: 'round',
			title: `Round ${unitsDone + 1}`,
			instructionLine:
				'Work this round from your pattern source, then tap Round done.',
			whyComment:
				'External patterns use a plain round checklist — open your source for the written instructions.',
			done: false,
			open: true,
		});
	} else {
		sections.push({
			id: 'finish',
			title: 'Finished',
			subtitle: 'Pattern complete',
			instructionLine: 'You marked this pattern finished.',
			done: true,
			open: true,
		});
	}

	return sections;
}

export function resolveExternalFollowContext(ref: ExternalPatternReference): {
	mode: 'checklist';
	pills: CounterPill[];
	sections: FollowSection[];
	actionLabel: string;
	percent: number;
	canUndo: boolean;
	sourceHref?: string;
	sourceLabel: string;
} {
	const progress = ref.progress;
	return {
		mode: 'checklist',
		pills: deriveExternalCounterPills(progress),
		sections: deriveExternalChecklistSections(progress),
		actionLabel: followActionLabel('checklist'),
		percent: followProgressPercent(progress),
		canUndo: (progress?.unitsDone ?? 0) > 0,
		sourceHref: externalSourceHref(ref),
		sourceLabel: externalSourceLabel(ref),
	};
}

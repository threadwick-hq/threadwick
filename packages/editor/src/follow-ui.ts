// Pure helpers for the Follow instruction box, counter pills and mode labels (TW-029).
// No DOM — consumed by @threadwick/core Follow components and apps/web.

import { startRowId } from './model';
import {
	deriveUnitDisplay,
	effectiveFollowMode,
	type UnitDisplay,
} from './progress';
import { summarizeRound } from './instructions';
import { isStart, STITCHES } from './symbols';
import type { FollowMode, Pattern, PatternProgress, PatternReference } from './types';

export type InstructionSegmentKind = 'stitch' | 'connector' | 'text';

export interface InstructionSegment {
	kind: InstructionSegmentKind;
	text: string;
}

export type CounterPillIcon = 'round' | 'repeat' | 'stitch';

export interface CounterPill {
	icon: CounterPillIcon;
	label: string;
	value: string;
}

export type FollowSectionId = 'start' | 'round' | 'finish';

export interface FollowSection {
	id: FollowSectionId;
	title: string;
	subtitle?: string;
	instructionLine?: string;
	whyComment?: string | null;
	done: boolean;
	open: boolean;
}

const STITCH_TOKEN =
	/^(?:\d+\s+)?(?:ch(?:\s+\d+)?|sl\s*st|sc|hdc|dc|tr|dtr|mr|dmr)(?:\s+[a-z]+)?$/i;

function patternStartLabel(pattern: Pattern): string | null {
	const st = pattern.stitches.find((s) => isStart(s.type));
	const type = st ? st.type : pattern.start;
	return type && STITCHES[type] ? STITCHES[type].name : null;
}

/** Split a summarizeRound line into emphasised stitch tokens and italic connectors. */
export function segmentsFromInstructionLine(line: string): InstructionSegment[] {
	const trimmed = line.trim();
	if (!trimmed) return [];
	const segments: InstructionSegment[] = [];
	const parts = trimmed.split(/, /);
	for (let i = 0; i < parts.length; i++) {
		const part = parts[i]!.trim();
		if (!part) continue;
		segments.push({
			kind: STITCH_TOKEN.test(part) ? 'stitch' : 'text',
			text: part,
		});
		if (i < parts.length - 1) {
			segments.push({ kind: 'connector', text: ', ' });
		}
	}
	return segments;
}

export function followActionLabel(mode: FollowMode): string {
	switch (mode) {
		case 'per-row':
			return 'Round done';
		case 'pattern':
			return 'Next repeat';
		case 'granular':
			return 'Cluster done';
		case 'checklist':
			return 'Step done';
		default:
			return 'Done';
	}
}

export function followWhyComment(mode: FollowMode): string | null {
	switch (mode) {
		case 'pattern':
			return 'Tap the big button each time you finish a corner repeat.';
		case 'granular':
			return 'Tap the big button each time you finish a cluster.';
		default:
			return null;
	}
}

export function deriveCounterPills(
	progress: PatternProgress | undefined,
	pattern: Pattern,
	mode: FollowMode,
): CounterPill[] {
	const display = deriveUnitDisplay(progress, pattern, mode);
	if (!display) return [];
	const pills: CounterPill[] = [
		{
			icon: 'round',
			label: 'Round',
			value: `${display.roundIndex}/${display.roundTotal}`,
		},
	];
	const unit = display.unit;
	if (unit.repeatIndex != null && unit.repeatTotal != null) {
		pills.push({
			icon: 'repeat',
			label: 'Rep',
			value: `${unit.repeatIndex}/${unit.repeatTotal}`,
		});
	}
	if (unit.clusterIndex != null && unit.clusterTotal != null) {
		pills.push({
			icon: 'stitch',
			label: 'Cluster',
			value: `${unit.clusterIndex}/${unit.clusterTotal}`,
		});
	} else if (unit.stitchIds.length > 0) {
		pills.push({
			icon: 'stitch',
			label: 'St',
			value: String(unit.stitchIds.length),
		});
	}
	return pills;
}

function workingRoundIds(pattern: Pattern): string[] {
	const startId = startRowId(pattern);
	return pattern.rounds
		.filter((r) => r.id !== startId)
		.map((r) => r.id);
}

export function deriveFollowSections(
	progress: PatternProgress | undefined,
	pattern: Pattern,
	mode: FollowMode,
): FollowSection[] {
	const unitsDone = progress?.unitsDone ?? 0;
	const completed = progress?.completed === true;
	const display = deriveUnitDisplay(progress, pattern, mode);
	const startId = startRowId(pattern);
	const startDone = unitsDone > 0 || completed;
	const startLabel = patternStartLabel(pattern) ?? 'Foundation';

	const currentRoundId =
		display?.unit.roundId ?? workingRoundIds(pattern)[0] ?? null;
	const currentRound = currentRoundId
		? pattern.rounds.find((r) => r.id === currentRoundId)
		: undefined;
	const roundLine =
		currentRoundId && currentRoundId !== startId
			? summarizeRound(pattern, currentRoundId)
			: '';
	const roundTitle = currentRound?.name ?? 'Round';
	const roundDone = completed;
	const roundOpen = startDone && !roundDone;

	const why =
		roundOpen && !roundDone ? followWhyComment(mode) : null;

	return [
		{
			id: 'start',
			title: 'Start',
			subtitle: startLabel,
			instructionLine: startLabel,
			done: startDone,
			open: !startDone,
		},
		{
			id: 'round',
			title: roundTitle,
			instructionLine: roundLine,
			whyComment: why,
			done: roundDone,
			open: roundOpen,
		},
		{
			id: 'finish',
			title: 'Finish',
			subtitle: 'Fasten off & block',
			instructionLine: 'Fasten off, weave in ends, and block to size.',
			done: completed,
			open: completed,
		},
	];
}

export function followProgressPercent(
	progress: PatternProgress | undefined,
): number {
	if (!progress?.unitsTotal) return 0;
	if (progress.completed) return 100;
	return Math.round((progress.unitsDone / progress.unitsTotal) * 100);
}

export function canUndoFollow(progress: PatternProgress | undefined): boolean {
	return (progress?.unitsDone ?? 0) > 0;
}

export function resolveFollowContext(
	ref: PatternReference,
	pattern: Pattern,
): {
	mode: FollowMode;
	display: UnitDisplay | null;
	pills: CounterPill[];
	sections: FollowSection[];
	actionLabel: string;
	percent: number;
	canUndo: boolean;
} {
	const mode = effectiveFollowMode(ref);
	const progress = ref.progress;
	return {
		mode,
		display: deriveUnitDisplay(progress, pattern, mode),
		pills: deriveCounterPills(progress, pattern, mode),
		sections: deriveFollowSections(progress, pattern, mode),
		actionLabel: followActionLabel(mode),
		percent: followProgressPercent(progress),
		canUndo: canUndoFollow(progress),
	};
}

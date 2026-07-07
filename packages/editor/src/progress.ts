// Follow progress state machine: advance/undo one Unit, derive display counters,
// aggregate per-pattern progress to project level (TW-028). Pure — no DOM.

import type {
	FollowMode,
	PatternProgress,
	PatternReference,
	ProgressCursor,
} from '@threadwick/types';

import {
	type DecomposeMode,
	decomposePattern,
	type FollowUnit,
	totalUnits,
	unitAddressRow,
} from './decomposition';
import type { ChartPattern, Project } from './types';
import { nowISO } from './util';

export interface ProjectProgressAggregate {
	unitsDone: number;
	unitsTotal: number;
	percent: number;
}

export interface UnitDisplay {
	unit: FollowUnit;
	roundIndex: number;
	roundTotal: number;
}

const STRUCTURED_MODES = new Set<FollowMode>([
	'per-row',
	'pattern',
	'granular',
]);

function isStructuredMode(mode: FollowMode): mode is DecomposeMode {
	return STRUCTURED_MODES.has(mode);
}

/** Resolve the effective follow mode for a reference (external → checklist). */
export function effectiveFollowMode(ref: PatternReference): FollowMode {
	if (ref.source !== 'threadwick') return 'checklist';
	return (
		ref.progress?.cursor?.followMode ??
		ref.followMode ??
		ref.suggestedFollowMode ??
		'per-row'
	);
}

/** Flatten all follow Units for a chart pattern at the given mode. */
export function flattenFollowUnits(
	pattern: ChartPattern,
	mode: FollowMode,
): FollowUnit[] {
	if (mode === 'checklist') {
		const startId = pattern.rounds[0]?.id;
		return pattern.rounds
			.filter((r) => r.id !== startId)
			.map((r) => ({
				address: unitAddressRow(r.id),
				roundId: r.id,
				stitchIds: [],
				index: 1,
				total: 1,
			}));
	}
	return decomposePattern(pattern, mode).flatMap((d) => d.units);
}

function unitIndex(units: FollowUnit[], address: string): number {
	return units.findIndex((u) => u.address === address);
}

function freshProgress(unitsTotal: number): PatternProgress {
	return { unitsDone: 0, unitsTotal };
}

/** Derive counter-pill context for the cursor (never stored). */
export function deriveUnitDisplay(
	progress: PatternProgress | undefined,
	pattern: ChartPattern,
	mode: FollowMode,
): UnitDisplay | null {
	if (progress?.completed) return null;
	const units = flattenFollowUnits(pattern, mode);
	if (!units.length) return null;
	const address = progress?.cursor?.unitAddress ?? units[0]!.address;
	const idx = unitIndex(units, address);
	const unit = idx >= 0 ? units[idx]! : units[0]!;
	const roundIds = [...new Set(units.map((u) => u.roundId))];
	const roundIndex = roundIds.indexOf(unit.roundId) + 1;
	return {
		unit,
		roundIndex: roundIndex > 0 ? roundIndex : 1,
		roundTotal: roundIds.length,
	};
}

function cursorAt(
	units: FollowUnit[],
	index: number,
	mode: FollowMode,
): ProgressCursor | undefined {
	if (index < 0 || index >= units.length) return undefined;
	return { unitAddress: units[index]!.address, followMode: mode };
}

function withTimestamp(progress: PatternProgress): PatternProgress {
	return { ...progress, updatedAt: nowISO() };
}

/** Advance one Unit; returns a new progress snapshot (immutable). */
export function advancePatternProgress(
	progress: PatternProgress | undefined,
	pattern: ChartPattern,
	mode: FollowMode,
): PatternProgress {
	if (progress?.completed) return progress;
	const units = flattenFollowUnits(pattern, mode);
	const total = units.length;
	if (!total) {
		return withTimestamp({
			unitsDone: 0,
			unitsTotal: 0,
			completed: true,
		});
	}

	if (progress?.cursor && progress.cursor.followMode !== mode) {
		// Mode changed — restart decomposition at the new granularity.
		return withTimestamp({
			...freshProgress(total),
			cursor: cursorAt(units, 0, mode),
			unitsTotal: total,
		});
	}

	const curIdx = progress?.cursor
		? unitIndex(units, progress.cursor.unitAddress)
		: -1;

	if (curIdx < 0) {
		return withTimestamp({
			unitsDone: 1,
			unitsTotal: total,
			cursor: cursorAt(units, 1, mode),
		});
	}

	const nextDone = Math.min(curIdx + 1, total);
	if (nextDone >= total) {
		return withTimestamp({
			unitsDone: total,
			unitsTotal: total,
			completed: true,
			cursor: progress?.cursor,
		});
	}

	return withTimestamp({
		unitsDone: nextDone,
		unitsTotal: total,
		cursor: cursorAt(units, nextDone, mode),
	});
}

/** Undo one advance step; no-op at the start frontier. */
export function undoPatternProgress(
	progress: PatternProgress | undefined,
	pattern: ChartPattern,
	mode: FollowMode,
): PatternProgress {
	if (!progress || progress.unitsDone <= 0) {
		return progress ?? freshProgress(flattenFollowUnits(pattern, mode).length);
	}

	const activeMode = progress.cursor?.followMode ?? mode;
	const units = flattenFollowUnits(pattern, activeMode);
	const total = units.length;
	const nextDone = progress.unitsDone - 1;

	if (nextDone <= 0) {
		return withTimestamp({
			unitsDone: 0,
			unitsTotal: total,
			completed: false,
			cursor: undefined,
		});
	}

	const cursorIdx = Math.min(nextDone, units.length - 1);
	return withTimestamp({
		unitsDone: nextDone,
		unitsTotal: total,
		completed: false,
		cursor: cursorAt(units, cursorIdx, activeMode),
	});
}

function refUnitsDone(
	ref: PatternReference,
	_resolvePattern: (patternId: string) => ChartPattern | undefined,
): number {
	if (ref.progress?.completed) {
		return ref.progress.unitsTotal ?? ref.progress.unitsDone;
	}
	return ref.progress?.unitsDone ?? 0;
}

function refUnitsTotal(
	ref: PatternReference,
	resolvePattern: (patternId: string) => ChartPattern | undefined,
): number {
	if (ref.progress?.unitsTotal != null) return ref.progress.unitsTotal;
	if (ref.source !== 'threadwick') {
		if (ref.progress?.completed) {
			return ref.progress.unitsDone ?? 0;
		}
		return Math.max(ref.progress?.unitsDone ?? 0, 1);
	}
	const chart = resolvePattern(ref.patternId);
	if (!chart) return 0;
	const mode = effectiveFollowMode(ref);
	if (mode === 'checklist') {
		return flattenFollowUnits(chart, mode).length;
	}
	if (isStructuredMode(mode)) return totalUnits(chart, mode);
	return 0;
}

/** Sum per-pattern progress into project-level aggregates (derived, never stored). */
export function aggregateProjectProgress(
	project: Project,
	resolvePattern: (patternId: string) => ChartPattern | undefined,
): ProjectProgressAggregate {
	const refs = project.makePatterns ?? [];
	let unitsDone = 0;
	let unitsTotal = 0;
	for (const ref of refs) {
		unitsDone += refUnitsDone(ref, resolvePattern);
		unitsTotal += refUnitsTotal(ref, resolvePattern);
	}
	const percent =
		unitsTotal > 0 ? Math.round((unitsDone / unitsTotal) * 100) : 0;
	return { unitsDone, unitsTotal, percent };
}

/** The pattern ref with the most recent progress touch — drives Continue making. */
export function continueMakingRef(
	project: Project,
): PatternReference | undefined {
	const refs = project.makePatterns ?? [];
	let best: PatternReference | undefined;
	let bestAt = '';
	for (const ref of refs) {
		const at = ref.progress?.updatedAt ?? '';
		if (!best || at > bestAt) {
			best = ref;
			bestAt = at;
		}
	}
	return best;
}

/** Whether a ref is finished (completed flag is sole authority). */
export function isRefCompleted(ref: PatternReference): boolean {
	return ref.progress?.completed === true;
}

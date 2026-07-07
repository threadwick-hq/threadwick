// Follow chart pane read primitives: stitch/round visual state, focus bounds,
// and interactive SVG markup (TW-030). No DOM.

import { INK } from './colors';
import { startRowId } from './model';
import { flattenFollowUnits } from './progress';
import { contentBounds, stitchToSVG } from './render';
import { STITCHES } from './symbols';
import type { ChartPattern, FollowMode, PatternProgress } from './types';
import { round } from './util';

export type FollowStitchState =
	| 'completed'
	| 'current'
	| 'upcoming'
	| 'ghosted';

export interface FollowChartModel {
	stitchStates: Map<string, FollowStitchState>;
	focusStitchIds: string[];
	currentRoundId: string | null;
}

export interface FollowChartStyle {
	color: string;
	opacity: number;
}

export interface FollowChartOpts {
	padding?: number;
	background?: string | null;
}

export interface StitchInspectInfo {
	id: string;
	name: string;
	abbr: string;
	roundName: string;
}

const FOLLOW_CURRENT = '#993C1D';

export const FOLLOW_CHART_STYLES: Record<FollowStitchState, FollowChartStyle> =
	{
		completed: { color: INK, opacity: 1 },
		current: { color: FOLLOW_CURRENT, opacity: 1 },
		upcoming: { color: INK, opacity: 0.38 },
		ghosted: { color: INK, opacity: 0.16 },
	};

function workingRoundIds(pattern: ChartPattern): string[] {
	const startId = startRowId(pattern);
	return pattern.rounds.filter((r) => r.id !== startId).map((r) => r.id);
}

function currentUnitIndex(
	units: ReturnType<typeof flattenFollowUnits>,
	progress: PatternProgress | undefined,
): number {
	if (progress?.completed) return units.length;
	if (progress?.cursor?.unitAddress) {
		const idx = units.findIndex(
			(u) => u.address === progress.cursor?.unitAddress,
		);
		if (idx >= 0) return idx;
	}
	return 0;
}

function unitIndexForStitch(
	units: ReturnType<typeof flattenFollowUnits>,
	stitchId: string,
): number {
	for (let i = 0; i < units.length; i++) {
		if (units[i]?.stitchIds.includes(stitchId)) return i;
	}
	return -1;
}

function roundIndex(roundIds: string[], roundId: string): number {
	return roundIds.indexOf(roundId);
}

/** Derive per-stitch visual state and the focus set for pan/zoom. */
export function deriveFollowChartModel(
	pattern: ChartPattern,
	progress: PatternProgress | undefined,
	mode: FollowMode,
): FollowChartModel {
	const units = flattenFollowUnits(pattern, mode);
	const roundIds = workingRoundIds(pattern);
	const stitchStates = new Map<string, FollowStitchState>();
	const curIdx = currentUnitIndex(units, progress);
	const currentUnit = curIdx < units.length ? units[curIdx]! : null;
	const currentRoundId = currentUnit?.roundId ?? roundIds[0] ?? null;
	const curRoundIdx =
		currentRoundId != null ? roundIndex(roundIds, currentRoundId) : -1;

	for (const st of pattern.stitches) {
		const rIdx = roundIndex(roundIds, st.round);
		if (rIdx < 0) {
			stitchStates.set(st.id, progress?.unitsDone ? 'completed' : 'upcoming');
			continue;
		}
		if (curRoundIdx < 0 || progress?.completed) {
			stitchStates.set(st.id, 'completed');
			continue;
		}
		if (rIdx < curRoundIdx) {
			stitchStates.set(st.id, 'completed');
			continue;
		}
		if (rIdx > curRoundIdx) {
			stitchStates.set(st.id, 'ghosted');
			continue;
		}
		// Current round
		if (mode === 'per-row' || mode === 'checklist') {
			stitchStates.set(st.id, 'current');
			continue;
		}
		const unitIdx = unitIndexForStitch(units, st.id);
		if (unitIdx < 0) {
			stitchStates.set(st.id, 'upcoming');
		} else if (unitIdx < curIdx) {
			stitchStates.set(st.id, 'completed');
		} else if (unitIdx === curIdx) {
			stitchStates.set(st.id, 'current');
		} else {
			stitchStates.set(st.id, 'upcoming');
		}
	}

	const focusStitchIds =
		currentUnit && currentUnit.stitchIds.length > 0
			? currentUnit.stitchIds
			: currentRoundId
				? pattern.stitches
						.filter((s) => s.round === currentRoundId)
						.map((s) => s.id)
				: [];

	return { stitchStates, focusStitchIds, currentRoundId };
}

export function stitchInspectInfo(
	pattern: ChartPattern,
	stitchId: string,
): StitchInspectInfo | null {
	const st = pattern.stitches.find((s) => s.id === stitchId);
	if (!st) return null;
	const def = STITCHES[st.type] ?? { name: st.type, abbr: '' };
	const round = pattern.rounds.find((r) => r.id === st.round);
	return {
		id: st.id,
		name: def.name,
		abbr: def.abbr,
		roundName: round?.name ?? 'Round',
	};
}

/** Bounding box for a stitch subset (pan/zoom target). */
export function boundsForStitches(
	pattern: ChartPattern,
	stitchIds: string[],
): ReturnType<typeof contentBounds> {
	if (!stitchIds.length) return contentBounds(pattern.stitches);
	const set = new Set(stitchIds);
	return contentBounds(pattern.stitches.filter((s) => set.has(s.id)));
}

function styleForState(state: FollowStitchState): FollowChartStyle {
	return FOLLOW_CHART_STYLES[state];
}

/** Interactive follow chart SVG with completed / lit / ghosted styling. */
export function followChartToSVG(
	pattern: ChartPattern,
	model: FollowChartModel,
	opts: FollowChartOpts = {},
): string {
	const { padding = 24, background = null } = opts;
	const stitches = pattern.stitches;
	if (!stitches.length) {
		const b = contentBounds([]);
		const w = b.maxX - b.minX;
		const h = b.maxY - b.minY;
		return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${round(b.minX)} ${round(b.minY)} ${round(w)} ${round(h)}" width="100%" height="100%"></svg>`;
	}

	const b = contentBounds(stitches);
	const minX = b.minX - padding;
	const minY = b.minY - padding;
	const maxX = b.maxX + padding;
	const maxY = b.maxY + padding;
	const w = maxX - minX;
	const h = maxY - minY;

	let body = '';
	for (const st of stitches) {
		const state = model.stitchStates.get(st.id) ?? 'ghosted';
		const style = styleForState(state);
		body += stitchToSVG(st, {
			interactive: true,
			color: style.color,
			opacity: style.opacity,
			klass: `follow-${state}`,
		});
	}

	const bg = background
		? `<rect x="${round(minX)}" y="${round(minY)}" width="${round(w)}" height="${round(h)}" fill="${background}"/>`
		: '';

	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${round(minX)} ${round(minY)} ${round(w)} ${round(h)}" width="100%" height="100%" role="img" aria-label="Pattern chart">${bg}<g>${body}</g></svg>`;
}

export function resolveFollowChartContext(
	pattern: ChartPattern,
	progress: PatternProgress | undefined,
	mode: FollowMode,
): {
	model: FollowChartModel;
	svg: string;
	focusBounds: ReturnType<typeof contentBounds>;
} {
	const model = deriveFollowChartModel(pattern, progress, mode);
	const svg = followChartToSVG(pattern, model);
	const focusBounds = boundsForStitches(pattern, model.focusStitchIds);
	return { model, svg, focusBounds };
}

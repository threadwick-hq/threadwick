// Pure instruction-decomposition engine: a round → follow Units at per-row /
// pattern / granular granularity from explicit corner/repeat marks (TW-027).
// No DOM; consumed by the Follow progress machine (TW-028) and counter pills.

import { chainOrder } from './connectivity';
import { isStart } from './symbols';
import type {
	ChartPattern,
	RepeatMark,
	Round,
	RoundFollowMarks,
	Stitch,
} from './types';

/** Granularity the one-action model counts at (mirrors @threadwick/types FollowMode minus checklist). */
export type DecomposeMode = 'per-row' | 'pattern' | 'granular';

export interface FollowUnit {
	/** Opaque UnitAddress — grammar owned here (TW-026 seam). */
	address: string;
	roundId: string;
	/** Stitches covered by this unit (for chart highlighting). */
	stitchIds: string[];
	/** 1-based index within the round for this mode. */
	index: number;
	total: number;
	/** Repeat counter pill metadata when the unit sits inside a RepeatMark. */
	repeatIndex?: number;
	repeatTotal?: number;
	/** Cluster counter within a pattern bite or repeat template (granular). */
	clusterIndex?: number;
	clusterTotal?: number;
}

export interface RoundDecomposition {
	roundId: string;
	requestedMode: DecomposeMode;
	/** per-row when marks are absent and finer modes were requested. */
	effectiveMode: DecomposeMode;
	units: FollowUnit[];
}

const ROW_SUFFIX = '@row';
const PAT_PREFIX = '/p/';
const GRAN_PREFIX = '/g/';

export function unitAddressRow(roundId: string): string {
	return `r:${roundId}${ROW_SUFFIX}`;
}

export function unitAddressPattern(roundId: string, index: number): string {
	return `r:${roundId}${PAT_PREFIX}${index}`;
}

export function unitAddressGranular(roundId: string, index: number): string {
	return `r:${roundId}${GRAN_PREFIX}${index}`;
}

export function hasFollowMarks(marks: RoundFollowMarks | undefined): boolean {
	if (!marks) return false;
	return marks.corners.length > 0 || marks.repeats.length > 0;
}

function roundById(pat: ChartPattern, roundId: string): Round | undefined {
	return pat.rounds.find((r) => r.id === roundId);
}

/** Working stitches for a round in chain order (excludes start markers). */
export function roundStitchOrder(pattern: ChartPattern, roundId: string): Stitch[] {
	return chainOrder(pattern.stitches, roundId).filter((s) => !isStart(s.type));
}

function indexById(order: Stitch[]): Map<string, number> {
	return new Map(order.map((s, i) => [s.id, i]));
}

function sortedCornerIndices(order: Stitch[], corners: string[]): number[] {
	const idx = indexById(order);
	return corners
		.map((id) => idx.get(id))
		.filter((i): i is number => i != null)
		.sort((a, b) => a - b);
}

/** Split chain order into pattern bites at explicit corner marks. */
function patternBitesFromCorners(
	order: Stitch[],
	cornerIndices: number[],
): Stitch[][] {
	if (!cornerIndices.length) return [order];
	const bites: Stitch[][] = [];
	let pos = 0;
	for (let c = 0; c < cornerIndices.length; c++) {
		const ci = cornerIndices[c];
		if (ci == null) continue;
		if (ci >= pos) {
			bites.push(order.slice(pos, ci + 1));
			pos = ci + 1;
		}
		const nextCorner = cornerIndices[c + 1];
		const sideEnd = nextCorner ?? order.length;
		if (pos < sideEnd) {
			bites.push(order.slice(pos, sideEnd));
			pos = sideEnd;
		}
	}
	if (pos < order.length) bites.push(order.slice(pos));
	return bites.filter((b) => b.length > 0);
}

type SegmentMeta = {
	stitches: Stitch[];
	repeatIndex?: number;
	repeatTotal?: number;
};

/** One pattern bite per explicit repeat iteration. */
function patternBitesFromRepeats(
	order: Stitch[],
	repeats: RepeatMark[],
): SegmentMeta[] {
	const idx = indexById(order);
	const bites: SegmentMeta[] = [];
	for (const rep of repeats) {
		const from = idx.get(rep.fromStitchId);
		const to = idx.get(rep.toStitchId);
		if (from == null || to == null || from > to) continue;
		const template = order.slice(from, to + 1);
		const times = Math.max(1, rep.times ?? 1);
		for (let t = 0; t < times; t++) {
			bites.push({
				stitches: template,
				repeatIndex: t + 1,
				repeatTotal: times,
			});
		}
	}
	return bites;
}

/** Group consecutive same-type stitches into instruction clusters. */
export function stitchClusters(stitches: Stitch[]): Stitch[][] {
	const out: Stitch[][] = [];
	let i = 0;
	while (i < stitches.length) {
		const t = stitches[i]?.type;
		if (!t) break;
		let n = 1;
		while (i + n < stitches.length && stitches[i + n]?.type === t) n++;
		out.push(stitches.slice(i, i + n));
		i += n;
	}
	return out;
}

function repeatMetaForStitch(
	stitchId: string,
	order: Stitch[],
	repeats: RepeatMark[],
): { repeatIndex?: number; repeatTotal?: number } {
	const idx = indexById(order);
	const si = idx.get(stitchId);
	if (si == null) return {};
	for (const rep of repeats) {
		const from = idx.get(rep.fromStitchId);
		const to = idx.get(rep.toStitchId);
		if (from == null || to == null || from > to) continue;
		const times = Math.max(1, rep.times ?? 1);
		const len = to - from + 1;
		for (let t = 0; t < times; t++) {
			const start = from + t * len;
			const end = start + len - 1;
			if (si >= start && si <= end) {
				return { repeatIndex: t + 1, repeatTotal: times };
			}
		}
	}
	return {};
}

function makeUnits(
	roundId: string,
	segments: SegmentMeta[],
	order: Stitch[],
	repeats: RepeatMark[],
	addressFn: (roundId: string, index: number) => string,
): FollowUnit[] {
	const total = segments.length;
	return segments.map((seg, i) => {
		const stitchIds = seg.stitches.map((s) => s.id);
		const firstId = stitchIds[0];
		const meta =
			seg.repeatIndex != null
				? { repeatIndex: seg.repeatIndex, repeatTotal: seg.repeatTotal }
				: firstId
					? repeatMetaForStitch(firstId, order, repeats)
					: {};
		return {
			address: addressFn(roundId, i),
			roundId,
			stitchIds,
			index: i + 1,
			total,
			...meta,
		};
	});
}

function perRowUnit(roundId: string, order: Stitch[]): FollowUnit {
	const stitchIds = order.map((s) => s.id);
	return {
		address: unitAddressRow(roundId),
		roundId,
		stitchIds,
		index: 1,
		total: 1,
	};
}

function patternBiteStitches(
	order: Stitch[],
	cornerIdx: number[],
	repeats: RepeatMark[],
): Stitch[][] {
	if (cornerIdx.length) return patternBitesFromCorners(order, cornerIdx);
	if (repeats.length) {
		const fromRepeats = patternBitesFromRepeats(order, repeats).map(
			(s) => s.stitches,
		);
		if (fromRepeats.length) return fromRepeats;
	}
	return [order];
}

function decomposePatternMode(
	roundId: string,
	order: Stitch[],
	cornerIdx: number[],
	repeats: RepeatMark[],
): RoundDecomposition {
	let segments: SegmentMeta[];
	if (cornerIdx.length) {
		segments = patternBitesFromCorners(order, cornerIdx).map((stitches) => ({
			stitches,
		}));
	} else {
		segments = patternBitesFromRepeats(order, repeats);
		if (!segments.length) segments = [{ stitches: order }];
	}
	return {
		roundId,
		requestedMode: 'pattern',
		effectiveMode: 'pattern',
		units: makeUnits(roundId, segments, order, repeats, unitAddressPattern),
	};
}

function decomposeGranularMode(
	roundId: string,
	order: Stitch[],
	cornerIdx: number[],
	repeats: RepeatMark[],
): RoundDecomposition {
	const biteStitches = patternBiteStitches(order, cornerIdx, repeats);
	const clusters: Stitch[][] = [];
	for (const bite of biteStitches) clusters.push(...stitchClusters(bite));

	const units: FollowUnit[] = clusters.map((cluster, i) => {
		const stitchIds = cluster.map((s) => s.id);
		const firstId = stitchIds[0];
		const meta = firstId ? repeatMetaForStitch(firstId, order, repeats) : {};
		return {
			address: unitAddressGranular(roundId, i),
			roundId,
			stitchIds,
			index: i + 1,
			total: clusters.length,
			clusterIndex: i + 1,
			clusterTotal: clusters.length,
			...meta,
		};
	});

	return {
		roundId,
		requestedMode: 'granular',
		effectiveMode: 'granular',
		units,
	};
}

/**
 * Decompose one round into follow Units at the requested granularity.
 * Pattern/granular modes fall back to a single per-row unit when marks are absent.
 */
export function decomposeRound(
	pattern: ChartPattern,
	roundId: string,
	mode: DecomposeMode,
): RoundDecomposition {
	const round = roundById(pattern, roundId);
	const order = roundStitchOrder(pattern, roundId);
	const marks = round?.followMarks;
	const marked = hasFollowMarks(marks);

	if (!order.length) {
		return {
			roundId,
			requestedMode: mode,
			effectiveMode: 'per-row',
			units: [],
		};
	}

	if (mode === 'per-row' || !marked) {
		return {
			roundId,
			requestedMode: mode,
			effectiveMode: 'per-row',
			units: [perRowUnit(roundId, order)],
		};
	}

	const corners = marks?.corners ?? [];
	const repeats = marks?.repeats ?? [];
	const cornerIdx = sortedCornerIndices(order, corners);

	if (mode === 'pattern') {
		return decomposePatternMode(roundId, order, cornerIdx, repeats);
	}
	return decomposeGranularMode(roundId, order, cornerIdx, repeats);
}

/** Decompose every working round (skips the Start row). */
export function decomposePattern(
	pattern: ChartPattern,
	mode: DecomposeMode,
): RoundDecomposition[] {
	const startId = pattern.rounds[0]?.id;
	return pattern.rounds
		.filter((r) => r.id !== startId)
		.map((r) => decomposeRound(pattern, r.id, mode));
}

export function findUnit(
	decomposition: RoundDecomposition,
	address: string,
): FollowUnit | undefined {
	return decomposition.units.find((u) => u.address === address);
}

/** Total units across all working rounds at the given mode. */
export function pruneFollowMarks(
	pattern: ChartPattern,
	removedIds: Set<string>,
): void {
	for (const round of pattern.rounds) {
		const m = round.followMarks;
		if (!m) continue;
		m.corners = m.corners.filter((id) => !removedIds.has(id));
		m.repeats = m.repeats.filter(
			(r) => !removedIds.has(r.fromStitchId) && !removedIds.has(r.toStitchId),
		);
		if (!hasFollowMarks(m)) round.followMarks = undefined;
	}
}

/** Total units across all working rounds at the given mode. */
export function totalUnits(pattern: ChartPattern, mode: DecomposeMode): number {
	return decomposePattern(pattern, mode).reduce(
		(n, d) => n + d.units.length,
		0,
	);
}

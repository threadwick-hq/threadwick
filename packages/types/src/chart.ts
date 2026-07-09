// Threadwick — the canonical chart-geometry vocabulary.
//
// The chart designer's output — placed stitches over ordered rounds, plus the view transform — is
// modelled here so a single geometry type flows through Studio authoring, the Follow read-side, and
// the marketplace. `ChartData` is what a `ChartArtifact.data` holds; @threadwick/editor's
// `ChartPattern` is this `ChartData` plus the authoring envelope (name + timestamps).
//
// Kept in its own file so ./pattern can build `ChartArtifact` on top of `ChartData` without a cycle:
// this file imports nothing from ./pattern.

export type StitchType =
	| 'ch'
	| 'slst'
	| 'sc'
	| 'hdc'
	| 'dc'
	| 'tr'
	| 'dtr' // working stitches
	| 'mr'
	| 'dmr'
	| 'chring'
	| 'slipknot'; // starts

export type Base =
	| { kind: 'stitch'; id: string }
	| { kind: 'space'; ids: [string, string] }
	| null;

// A single placed stitch. Named `ChartStitch` (not `Stitch`) because ./pattern already exports a
// `Stitch` — the special-stitch glossary entry. @threadwick/editor re-exports this as its historical
// `Stitch`.
export interface ChartStitch {
	id: string;
	round: string;
	type: StitchType;
	origin: string | null; // the stitch it comes out of
	base: Base; // the stitch head / space it is worked into
	x: number; // base anchor (bottom of the marker)
	y: number;
	rot: number;
	len: number | null; // post length; null = the type's default
	color: string | null;
	mirror: boolean;
	auto?: boolean; // chains: auto-align between neighbours (default true)
}

/** Explicit repeat region for follow decomposition (TW-027). */
export interface RepeatMark {
	id: string;
	fromStitchId: string;
	toStitchId: string;
	/** Times the template is worked; default 1. */
	times?: number;
}

/** Authoring marks that drive per-row / pattern / granular decomposition (TW-027). */
export interface RoundFollowMarks {
	/** Stitch ids flagged as corner positions (chain order). */
	corners: string[];
	repeats: RepeatMark[];
}

export interface Round {
	id: string;
	name: string;
	followMarks?: RoundFollowMarks;
}

export interface PatternView {
	scale: number;
	panX: number;
	panY: number;
}

/**
 * How a chart is constructed. A distinct axis from `ChartArtifact.kind` ('stitch' | 'colorwork'):
 * `construction` is the working method, `kind` is whether the chart carries a colour key.
 */
export type PatternKind = 'granny' | 'round' | 'flat';

// ── ChartData: the unified chart geometry (what ChartArtifact.data holds) ─────
// The single canonical chart model. @threadwick/editor's `ChartPattern` extends this with the
// authoring envelope (name + createdAt/updatedAt). Persisted through the storage codec; the
// `construction` field was the editor's `ChartPattern.type` before the Phase 7 unification.
export interface ChartData {
	id: string;
	construction: PatternKind;
	start: StitchType | null;
	rounds: Round[];
	activeRound: string;
	stitches: ChartStitch[];
	view: PatternView;
}

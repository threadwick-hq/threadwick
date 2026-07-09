// Shared domain types for threadwick studio.

import type {
	Base,
	ChartData,
	ChartStitch,
	FollowMode,
	MakerStatus,
	Pattern,
	PatternKind,
	PatternProgress,
	PatternReference,
	PatternView,
	ProgressCursor,
	ProjectPhoto,
	RepeatMark,
	Round,
	RoundFollowMarks,
	StitchType,
	UnitAddress,
	UsedTool,
	UsedYarn,
} from '@threadwick/types';

// The chart-geometry vocabulary now lives in @threadwick/types (the single canonical owner —
// Phase 7 "one model, not a fork"). Re-exported here under the editor's historical names so every
// consumer compiles unchanged; the editor's `Stitch` IS the geometry `ChartStitch`, and the freed
// `Pattern` name now points at the authoring model (see ./chart's seam comment).
export type {
	Base,
	ChartData,
	ChartStitch as Stitch,
	FollowMode,
	MakerStatus,
	Pattern,
	PatternKind,
	PatternProgress,
	PatternReference,
	PatternView,
	ProgressCursor,
	ProjectPhoto,
	RepeatMark,
	Round,
	RoundFollowMarks,
	StitchType,
	UnitAddress,
	UsedTool,
	UsedYarn,
};

// The chart the editor authors: the shared geometry (ChartData) plus the authoring envelope
// (name + timestamps). ChartData.construction was the editor's ChartPattern.type before Phase 7.
export interface ChartPattern extends ChartData {
	name: string;
	createdAt: string;
	updatedAt: string;
}

export interface Yarn {
	id: string;
	name: string;
	brand: string;
	weight: string;
	color: string;
	hex: string;
	notes: string;
}
export interface LinkRes {
	id: string;
	title: string;
	url: string;
	kind: string;
}
export interface NoteRes {
	id: string;
	title: string;
	body: string;
}
export interface VariationRes {
	id: string;
	title: string;
	body: string;
}
export interface Resources {
	yarns: Yarn[];
	links: LinkRes[];
	notes: NoteRes[];
	variations: VariationRes[];
}
export type ResourceKind = keyof Resources;

// A project keeps an ordered list of VERSIONS. Exactly one can be Published (the
// "working" version others see); a single editable Draft can sit alongside it,
// and superseded versions become Outdated. Patterns + resources live inside the
// version, so a new draft can be edited without disturbing the published one.
export type VersionStatus = 'draft' | 'published' | 'outdated';

export interface ProjectVersion {
	id: string;
	label: string; // e.g. "v1", "v2"
	status: VersionStatus;
	patterns: ChartPattern[];
	resources: Resources;
	createdAt: string;
	updatedAt: string;
	publishedAt: string | null; // when it was published (null until then)
}

export interface Project {
	id: string;
	name: string;
	description: string;
	versions: ProjectVersion[];
	activeVersionId: string; // which version the UI is currently showing
	createdAt: string;
	updatedAt: string;
	/** Maker-plane status (§5); distinct from VersionStatus. */
	makerStatus?: MakerStatus;
	/** Source-tagged pattern refs for Follow (§5/§6); converges with @threadwick/types Project.patterns in Phase 7. */
	makePatterns?: PatternReference[];
	/** Maker-plane overview fields (§5) — converge with @threadwick/types Project in Phase 7. */
	photos?: ProjectPhoto[];
	yarns?: UsedYarn[];
	tools?: UsedTool[];
	timeLoggedMs?: number;
	lastWorkedAt?: string;
	ravelryProjectId?: string;
}

export interface Point {
	x: number;
	y: number;
}

// ---- render shape descriptors ---------------------------------------------
export type Shape =
	| { k: 'line'; x1: number; y1: number; x2: number; y2: number }
	| { k: 'ellipse'; cx: number; cy: number; rx: number; ry: number }
	| { k: 'circle'; cx: number; cy: number; r: number }
	| { k: 'dot'; cx: number; cy: number; r: number }
	| { k: 'path'; d: string; fill?: boolean }
	| { k: 'group'; rot: number; shapes: Shape[] };

export interface Built {
	shapes: Shape[];
	height: number;
	head?: Point;
}

// A resolved base reference with its current world point (from pickBase).
export type BaseHit =
	| { kind: 'stitch'; id: string; point: Point; d: number }
	| { kind: 'space'; ids: [string, string]; point: Point; d: number };

export interface SpaceSlot {
	ids: [string, string];
	point: Point;
}

export type UIView = 'projects' | 'project' | 'editor';
export interface UIState {
	view: UIView;
	projectId: string | null;
	patternId: string | null;
}

// Portable project file wrapper.
export interface ProjectFile {
	format: string;
	version: number;
	exportedAt: string;
	project: Project;
}

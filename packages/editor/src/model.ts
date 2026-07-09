// The data model for threadwick studio. A PROJECT is your folder: it holds many
// PATTERNS plus shared RESOURCES. A PATTERN has a type (phase 1: only "granny")
// and contains ordered ROUNDS and the STITCHES placed in them.

import { isStart } from './symbols';
import type {
	Base,
	ChartPattern,
	FollowMode,
	MakerStatus,
	PatternKind,
	PatternProgress,
	PatternReference,
	Project,
	ProjectFile,
	ProjectPhoto,
	ProjectVersion,
	Resources,
	Round,
	Stitch,
	StitchType,
	UsedTool,
	UsedYarn,
	VersionStatus,
} from './types';
import { deepClone, nowISO, uid } from './util';

export const FILE_FORMAT = 'threadwick-studio';
export const FILE_VERSION = 5; // v5: unified content model — chart geometry is @threadwick/types ChartData; ChartPattern.type renamed to construction (Phase 7)

export interface PatternTypeInfo {
	id: PatternKind;
	name: string;
	worked: string;
	available: boolean;
}
export const PATTERN_TYPES: Record<PatternKind, PatternTypeInfo> = {
	granny: {
		id: 'granny',
		name: 'Granny square',
		worked: 'in the round from a centre start',
		available: true,
	},
	round: {
		id: 'round',
		name: 'Worked in the round',
		worked: 'spiral / joined rounds',
		available: false,
	},
	flat: {
		id: 'flat',
		name: 'Worked flat',
		worked: 'rows back and forth',
		available: false,
	},
};

// Default names are placeholders the user is meant to replace; the UI renders
// them muted to say so.
export function isPlaceholderName(name: string): boolean {
	return name === 'Untitled project' || name === 'Untitled pattern';
}

export function newRound(name?: string): Round {
	return { id: uid('rnd'), name: name || 'Round 1' };
}

export function newPattern(
	name?: string,
	type: PatternKind = 'granny',
): ChartPattern {
	const startRow: Round = { id: uid('rnd'), name: 'Start' };
	const r1 = newRound('Round 1');
	return {
		id: uid('pat'),
		construction: PATTERN_TYPES[type] ? type : 'granny',
		name: name || 'Untitled pattern',
		start: null,
		rounds: [startRow, r1], // the Start row (row 0) exists from the start
		activeRound: startRow.id, // open on Start so you pick a starting stitch first
		stitches: [],
		view: { scale: 1.4, panX: 0, panY: 0 },
		createdAt: nowISO(),
		updatedAt: nowISO(),
	};
}

export function emptyResources(): Resources {
	return { yarns: [], links: [], notes: [], variations: [] };
}

export function newVersion(
	label = 'v1',
	status: VersionStatus = 'draft',
): ProjectVersion {
	return {
		id: uid('ver'),
		label,
		status,
		patterns: [],
		resources: emptyResources(),
		createdAt: nowISO(),
		updatedAt: nowISO(),
		publishedAt: null,
	};
}

export function newProject(name?: string): Project {
	const v = newVersion('v1', 'draft');
	return {
		id: uid('prj'),
		name: name || 'Untitled project',
		description: '',
		versions: [v],
		activeVersionId: v.id,
		createdAt: nowISO(),
		updatedAt: nowISO(),
	};
}

// ---- version helpers -------------------------------------------------------
// The version currently selected for viewing/editing (with sensible fallbacks).
export function activeVersion(prj: Project): ProjectVersion {
	return (
		prj.versions.find((v) => v.id === prj.activeVersionId) ??
		publishedVersion(prj) ??
		prj.versions[prj.versions.length - 1]!
	);
}
export function publishedVersion(prj: Project): ProjectVersion | undefined {
	return prj.versions.find((v) => v.status === 'published');
}
export function draftVersion(prj: Project): ProjectVersion | undefined {
	return prj.versions.find((v) => v.status === 'draft');
}
// For cards/thumbnails: prefer the live published version, else whatever's active.
export function displayVersion(prj: Project): ProjectVersion {
	return publishedVersion(prj) ?? activeVersion(prj);
}
// Next "vN" label, one past the highest existing numbered version.
export function nextVersionLabel(prj: Project): string {
	let max = 0;
	for (const v of prj.versions) {
		const m = /^v(\d+)$/.exec(v.label);
		if (m) max = Math.max(max, +m[1]!);
	}
	return `v${max + 1}`;
}

// ---- normalisation / migration --------------------------------------------
// biome-ignore-start lint/suspicious/noExplicitAny: the normalize* functions parse untrusted project JSON at the trust boundary; `any` is the deliberate input type here.
function normalizeFollowMarks(m: any) {
	if (!m) return undefined;
	const corners = Array.isArray(m.corners) ? m.corners.map(String) : [];
	const repeats = Array.isArray(m.repeats)
		? m.repeats
				.map((rep: any) => {
					if (!rep?.fromStitchId || !rep?.toStitchId) return null;
					return {
						id: rep.id || uid('rep'),
						fromStitchId: String(rep.fromStitchId),
						toStitchId: String(rep.toStitchId),
						times:
							rep.times != null
								? Math.max(1, Math.floor(+rep.times))
								: undefined,
					};
				})
				.filter(Boolean)
		: [];
	if (!corners.length && !repeats.length) return undefined;
	return { corners, repeats };
}

function normalizeStitch(s: any): Stitch | null {
	if (!s?.type) return null;
	let base: Base = null;
	if (s.base && (s.base.kind === 'stitch' || s.base.kind === 'space')) {
		base =
			s.base.kind === 'stitch'
				? { kind: 'stitch', id: String(s.base.id) }
				: {
						kind: 'space',
						ids: [String(s.base.ids[0]), String(s.base.ids[1])],
					};
	}
	return {
		id: s.id || uid('st'),
		round: s.round,
		type: s.type as StitchType,
		origin: s.origin ?? null,
		base,
		x: +s.x || 0,
		y: +s.y || 0,
		rot: +s.rot || 0,
		len: s.len == null ? null : +s.len,
		color: s.color ?? null,
		mirror: !!s.mirror,
		auto: s.type === 'ch' ? s.auto !== false : undefined,
	};
}

export function normalizePattern(p: any = {}): ChartPattern {
	const pat = newPattern(
		p.name,
		// Read the current key only — no `?? p.type` fallback. Pre-release policy rejects retired
		// shapes (the FILE_VERSION gate bails a v4 envelope wholesale before it reaches here).
		PATTERN_TYPES[p.construction as PatternKind] ? p.construction : 'granny',
	);
	if (p.id) pat.id = p.id;
	if (Array.isArray(p.rounds) && p.rounds.length) {
		pat.rounds = p.rounds.map((r: any, i: number) => ({
			id: r.id || uid('rnd'),
			name: r.name || `Round ${i + 1}`,
			followMarks: normalizeFollowMarks(r.followMarks),
		}));
	}
	pat.start = (p.start ?? null) as StitchType | null;
	pat.stitches = Array.isArray(p.stitches)
		? (p.stitches.map(normalizeStitch).filter(Boolean) as Stitch[])
		: [];
	const roundIds = new Set(pat.rounds.map((r) => r.id));
	pat.activeRound = roundIds.has(p.activeRound)
		? p.activeRound
		: pat.rounds[pat.rounds.length - 1]!.id;
	pat.stitches = pat.stitches.filter((s) => roundIds.has(s.round));
	ensureStartRow(pat);
	if (p.view)
		pat.view = {
			scale: +p.view.scale || 1.4,
			panX: +p.view.panX || 0,
			panY: +p.view.panY || 0,
		};
	pat.createdAt = p.createdAt || pat.createdAt;
	pat.updatedAt = p.updatedAt || pat.updatedAt;
	return pat;
}

function normalizeResources(r: any = {}): Resources {
	const res = emptyResources();
	if (Array.isArray(r.yarns))
		res.yarns = r.yarns.map((y: any) => ({
			id: y.id || uid('yrn'),
			name: y.name || '',
			brand: y.brand || '',
			weight: y.weight || '',
			color: y.color || '',
			hex: y.hex || '',
			notes: y.notes || '',
		}));
	if (Array.isArray(r.links))
		res.links = r.links.map((l: any) => ({
			id: l.id || uid('lnk'),
			title: l.title || '',
			url: l.url || '',
			kind: l.kind || 'link',
		}));
	if (Array.isArray(r.notes))
		res.notes = r.notes.map((n: any) => ({
			id: n.id || uid('not'),
			title: n.title || '',
			body: n.body || '',
		}));
	if (Array.isArray(r.variations))
		res.variations = r.variations.map((v: any) => ({
			id: v.id || uid('var'),
			title: v.title || '',
			body: v.body || '',
		}));
	return res;
}

function normalizeStatus(s: any): VersionStatus {
	return s === 'published' || s === 'outdated' || s === 'draft' ? s : 'draft';
}

function normalizeVersion(v: any = {}, fallbackLabel = 'v1'): ProjectVersion {
	const ver = newVersion(
		typeof v.label === 'string' && v.label ? v.label : fallbackLabel,
		normalizeStatus(v.status),
	);
	if (v.id) ver.id = v.id;
	ver.patterns = Array.isArray(v.patterns)
		? v.patterns.map(normalizePattern)
		: [];
	ver.resources = normalizeResources(v.resources);
	ver.createdAt = v.createdAt || ver.createdAt;
	ver.updatedAt = v.updatedAt || ver.updatedAt;
	ver.publishedAt =
		v.publishedAt || (ver.status === 'published' ? ver.updatedAt : null);
	return ver;
}

// At most one Published version: if data carries several, keep the most recently
// published and demote the rest to Outdated.
function enforceSinglePublished(versions: ProjectVersion[]): void {
	const pub = versions.filter((v) => v.status === 'published');
	if (pub.length <= 1) return;
	pub.sort((a, b) => (a.publishedAt || '').localeCompare(b.publishedAt || ''));
	for (let i = 0; i < pub.length - 1; i++) pub[i]!.status = 'outdated';
}

const MAKER_STATUSES = new Set<MakerStatus>([
	'draft',
	'in-progress',
	'on-hold',
	'done',
	'frogged',
]);
const FOLLOW_MODES = new Set<FollowMode>([
	'per-row',
	'pattern',
	'granular',
	'checklist',
]);

function normalizeMakerStatus(s: unknown): MakerStatus | undefined {
	return typeof s === 'string' && MAKER_STATUSES.has(s as MakerStatus)
		? (s as MakerStatus)
		: undefined;
}

function normalizeFollowMode(s: unknown): FollowMode | undefined {
	return typeof s === 'string' && FOLLOW_MODES.has(s as FollowMode)
		? (s as FollowMode)
		: undefined;
}

function normalizePatternProgress(raw: any): PatternProgress | undefined {
	if (!raw || typeof raw !== 'object') return undefined;
	const unitsDone = Math.max(0, Math.floor(+(raw as any).unitsDone || 0));
	const progress: PatternProgress = { unitsDone };
	if ((raw as any).unitsTotal != null) {
		progress.unitsTotal = Math.max(0, Math.floor(+(raw as any).unitsTotal));
	}
	if ((raw as any).completed === true) progress.completed = true;
	if (typeof (raw as any).updatedAt === 'string')
		progress.updatedAt = (raw as any).updatedAt;
	const cur = (raw as any).cursor;
	if (cur && typeof cur === 'object' && typeof cur.unitAddress === 'string') {
		const mode = normalizeFollowMode(cur.followMode);
		if (mode) {
			progress.cursor = {
				unitAddress: String(cur.unitAddress),
				followMode: mode,
			};
		}
	}
	return progress;
}

function normalizePatternReference(
	raw: any,
	resolveLabel: (patternId: string) => string,
): PatternReference | null {
	if (!raw || typeof raw !== 'object') return null;
	const id = raw.id ? String(raw.id) : uid('ref');
	const label =
		typeof raw.label === 'string'
			? raw.label
			: raw.source === 'threadwick' && raw.patternId
				? resolveLabel(String(raw.patternId))
				: '';
	const followMode = normalizeFollowMode(raw.followMode);
	const suggestedFollowMode = normalizeFollowMode(raw.suggestedFollowMode);
	const progress = normalizePatternProgress(raw.progress);
	const source = raw.source;
	if (source === 'threadwick' && raw.patternId) {
		const ref: PatternReference = {
			id,
			label,
			source: 'threadwick',
			patternId: String(raw.patternId),
		};
		if (followMode) ref.followMode = followMode;
		if (suggestedFollowMode) ref.suggestedFollowMode = suggestedFollowMode;
		if (progress) ref.progress = progress;
		if (raw.patternVersionId)
			ref.patternVersionId = String(raw.patternVersionId);
		return ref;
	}
	if (source === 'ravelry' || source === 'blog' || source === 'pdf') {
		const ref: PatternReference = { id, label, source };
		if (followMode) ref.followMode = followMode;
		if (suggestedFollowMode) ref.suggestedFollowMode = suggestedFollowMode;
		if (progress) ref.progress = progress;
		if (typeof raw.url === 'string') ref.url = raw.url;
		if (typeof raw.designer === 'string') ref.designer = raw.designer;
		if (typeof raw.ravelryId === 'string') ref.ravelryId = raw.ravelryId;
		return ref;
	}
	return null;
}

function normalizeMakePatterns(
	p: any,
	versions: ProjectVersion[],
): PatternReference[] | undefined {
	const resolveLabel = (patternId: string) => {
		for (const v of versions) {
			const pat = v.patterns.find((x) => x.id === patternId);
			if (pat) return pat.name;
		}
		return '';
	};

	// Current shape only: `makePatterns` is the one field carrying refs.
	// (Pre-release policy — retired shapes are rejected, not upgraded.)
	if (!Array.isArray(p.makePatterns)) return undefined;
	const refs = p.makePatterns
		.map((r: unknown) => normalizePatternReference(r, resolveLabel))
		.filter(Boolean) as PatternReference[];
	return refs.length ? refs : undefined;
}

function normalizeUsedYarns(raw: unknown): UsedYarn[] | undefined {
	if (!Array.isArray(raw)) return undefined;
	const yarns = raw
		.map((item) => {
			if (!item || typeof item !== 'object') return null;
			const y = item as Record<string, unknown>;
			if (typeof y.id !== 'string' || typeof y.label !== 'string') return null;
			const yarn: UsedYarn = { id: y.id, label: y.label };
			if (typeof y.stashId === 'string') yarn.stashId = y.stashId;
			if (typeof y.colorway === 'string') yarn.colorway = y.colorway;
			if (typeof y.quantity === 'string') yarn.quantity = y.quantity;
			if (typeof y.acquired === 'boolean') yarn.acquired = y.acquired;
			return yarn;
		})
		.filter(Boolean) as UsedYarn[];
	return yarns.length ? yarns : undefined;
}

function normalizeUsedTools(raw: unknown): UsedTool[] | undefined {
	if (!Array.isArray(raw)) return undefined;
	const tools = raw
		.map((item) => {
			if (!item || typeof item !== 'object') return null;
			const t = item as Record<string, unknown>;
			if (typeof t.id !== 'string' || typeof t.label !== 'string') return null;
			const tool: UsedTool = { id: t.id, label: t.label };
			if (typeof t.stashId === 'string') tool.stashId = t.stashId;
			if (typeof t.acquired === 'boolean') tool.acquired = t.acquired;
			return tool;
		})
		.filter(Boolean) as UsedTool[];
	return tools.length ? tools : undefined;
}

function normalizeProjectPhotos(raw: unknown): ProjectPhoto[] | undefined {
	if (!Array.isArray(raw)) return undefined;
	const photos = raw
		.map((item) => {
			if (!item || typeof item !== 'object') return null;
			const p = item as Record<string, unknown>;
			if (typeof p.id !== 'string') return null;
			const image = p.image as Record<string, unknown> | undefined;
			if (!image || typeof image.src !== 'string') return null;
			const photo: ProjectPhoto = {
				id: p.id,
				image: { src: image.src },
			};
			if (typeof image.alt === 'string') photo.image.alt = image.alt;
			if (typeof image.caption === 'string')
				photo.image.caption = image.caption;
			if (typeof p.patternRefId === 'string')
				photo.patternRefId = p.patternRefId;
			return photo;
		})
		.filter(Boolean) as ProjectPhoto[];
	return photos.length ? photos : undefined;
}

export function normalizeProject(p: any = {}): Project {
	const prj = newProject(p.name);
	if (p.id) prj.id = p.id;
	prj.description = p.description || '';
	if (Array.isArray(p.versions) && p.versions.length) {
		prj.versions = p.versions.map((v: any, i: number) =>
			normalizeVersion(v, `v${i + 1}`),
		);
	}
	// else: keep newProject's fresh draft version — a project without
	// versions[] is not a current shape, and pre-release there is no
	// upgrade path for retired shapes.
	enforceSinglePublished(prj.versions);
	const active =
		prj.versions.find((v) => v.id === p.activeVersionId) ??
		publishedVersion(prj) ??
		draftVersion(prj) ??
		prj.versions[0]!;
	prj.activeVersionId = active.id;
	prj.createdAt = p.createdAt || prj.createdAt;
	prj.updatedAt = p.updatedAt || prj.updatedAt;

	const makePatterns = normalizeMakePatterns(p, prj.versions);
	if (makePatterns) prj.makePatterns = makePatterns;
	const makerStatus = normalizeMakerStatus(p.makerStatus);
	if (makerStatus) prj.makerStatus = makerStatus;
	else if (makePatterns?.some((r) => r.progress?.unitsDone)) {
		prj.makerStatus = 'in-progress';
	} else if (makePatterns?.length) {
		prj.makerStatus = 'draft';
	}

	const photos = normalizeProjectPhotos(p.photos);
	if (photos) prj.photos = photos;
	const yarns = normalizeUsedYarns(p.yarns);
	if (yarns) prj.yarns = yarns;
	const tools = normalizeUsedTools(p.tools);
	if (tools) prj.tools = tools;
	if (typeof p.timeLoggedMs === 'number' && p.timeLoggedMs >= 0) {
		prj.timeLoggedMs = p.timeLoggedMs;
	}
	if (typeof p.lastWorkedAt === 'string') prj.lastWorkedAt = p.lastWorkedAt;
	if (typeof p.ravelryProjectId === 'string')
		prj.ravelryProjectId = p.ravelryProjectId;

	return prj;
}
// biome-ignore-end lint/suspicious/noExplicitAny: end of the migration parse boundary.

// ---- the "Start" row (row 0) ----------------------------------------------
// rounds[0] is always the Start row: it exists from creation and holds only the
// start marker; the working rows follow it. These helpers treat rounds[0] as
// the Start row.
export function startRowId(pat: ChartPattern): string | null {
	return pat.rounds[0] ? pat.rounds[0].id : null;
}
export function isStartRow(pat: ChartPattern, roundId: string | null): boolean {
	return roundId != null && pat.rounds[0]?.id === roundId;
}
export function hasStart(pat: ChartPattern): boolean {
	return pat.stitches.some((s) => isStart(s.type));
}

// Guarantee a "Start" row at index 0 (holding only the start marker, if any),
// plus at least one working row after it. Migrates older data.
export function ensureStartRow(pat: ChartPattern): void {
	const start = pat.stitches.find((s) => isStart(s.type));
	if (start) {
		const inSame = pat.stitches.filter((s) => s.round === start.round);
		const aloneInRound = inSame.length === 1;
		if (aloneInRound && pat.rounds[0] && pat.rounds[0].id !== start.round) {
			// its row is already dedicated but not first — move that row to the front
			const startRound = pat.rounds.find((r) => r.id === start.round)!;
			pat.rounds = [
				startRound,
				...pat.rounds.filter((r) => r.id !== start.round),
			];
		} else if (!aloneInRound) {
			const r: Round = { id: uid('rnd'), name: 'Start' };
			pat.rounds.unshift(r);
			start.round = r.id;
		}
	} else {
		const first = pat.rounds[0];
		const firstHasStitches =
			!!first && pat.stitches.some((s) => s.round === first.id);
		if (!first || firstHasStitches)
			pat.rounds.unshift({ id: uid('rnd'), name: 'Start' });
	}
	if (pat.rounds[0]) pat.rounds[0].name = 'Start';
	if (pat.rounds.length < 2) pat.rounds.push(newRound('Round 1'));
	if (!pat.rounds.find((r) => r.id === pat.activeRound))
		pat.activeRound = pat.rounds[0]!.id;
}

// ---- portable project file -------------------------------------------------
export function projectToFile(project: Project): ProjectFile {
	return {
		format: FILE_FORMAT,
		version: FILE_VERSION,
		exportedAt: nowISO(),
		project: deepClone(project),
	};
}

export function projectFromFile(data: unknown): Project | null {
	if (!data || typeof data !== 'object') return null;
	const rec = data as Record<string, unknown>;
	// Pre-release policy: only the current envelope is accepted — no
	// compatibility window for older versions or bare (unwrapped) projects
	// until release (see apps/studio/AGENTS.md, Data ownership).
	if (rec.version !== FILE_VERSION) return null;
	if (!rec.project || typeof rec.project !== 'object') return null;
	return normalizeProject(rec.project);
}

import type {
	Pattern,
	PatternVersion,
	PatternVersioning,
	PatternVersionStatus,
} from '@threadwick/types';
import { activePatternVersion } from './pattern-overview';
import { deepClone, nowISO, uid } from './util';

export type PatternPublishAction = 'publish-pattern' | 'publish-version' | 'new-draft';

export type PatternQualityTier = 'floor' | 'optional';

export type PatternQualityCheck = {
	id: string;
	label: string;
	present: boolean;
	tier: PatternQualityTier;
};

const VERSION_STATUS_LABEL: Record<PatternVersionStatus, string> = {
	draft: 'draft',
	published: 'published',
	outdated: 'outdated',
};

export function patternVersionStatusLabel(status: PatternVersionStatus): string {
	return VERSION_STATUS_LABEL[status];
}

export function patternDraftVersion(pattern: Pattern): PatternVersion | undefined {
	return pattern.versioning?.versions.find((v) => v.status === 'draft');
}

export function patternPublishedVersion(pattern: Pattern): PatternVersion | undefined {
	return pattern.versioning?.versions.find((v) => v.status === 'published');
}

export function nextPatternVersionLabel(versioning: PatternVersioning): string {
	let max = 0;
	for (const v of versioning.versions) {
		const m = /^v(\d+)$/.exec(v.label);
		if (m) max = Math.max(max, +m[1]!);
	}
	return `v${max + 1}`;
}

/** Contextual primary action for the pinned version tile (§4.1). */
export function patternPublishAction(pattern: Pattern): PatternPublishAction {
	const visibility = pattern.versioning?.visibility ?? 'private';
	if (visibility === 'private') return 'publish-pattern';
	const draft = patternDraftVersion(pattern);
	const active = activePatternVersion(pattern);
	if (draft && active?.status === 'draft') return 'publish-version';
	return 'new-draft';
}

export function patternPublishActionLabel(action: PatternPublishAction): string {
	switch (action) {
		case 'publish-pattern':
			return 'Publish pattern';
		case 'publish-version':
			return 'Publish version';
		case 'new-draft':
			return 'New draft';
	}
}

function hasChartOrWrittenArtifact(pattern: Pattern): boolean {
	for (const component of pattern.components) {
		for (const artifact of component.artifacts) {
			if (artifact.type === 'chart' || artifact.type === 'written') return true;
		}
	}
	return false;
}

function hasPhoto(pattern: Pattern): boolean {
	const gallery = pattern.overview.gallery ?? [];
	if (gallery.length > 0) return true;
	return Boolean(pattern.overview.cover?.src?.trim());
}

function hasMaterialsAndGauge(pattern: Pattern): boolean {
	if (pattern.materials.length === 0) return false;
	return pattern.notes.some((n) => n.kind === 'gauge');
}

function hasSchematic(pattern: Pattern): boolean {
	for (const component of pattern.components) {
		if (component.artifacts.some((a) => a.type === 'schematic')) return true;
	}
	return false;
}

/** Reward-never-penalize quality audit (§4.5 edit face). */
export function patternQualityChecks(pattern: Pattern): PatternQualityCheck[] {
	return [
		{
			id: 'artifact',
			label: 'Chart or written instructions',
			present: hasChartOrWrittenArtifact(pattern),
			tier: 'floor',
		},
		{
			id: 'photo',
			label: 'Finished-object photo',
			present: hasPhoto(pattern),
			tier: 'floor',
		},
		{
			id: 'materials-gauge',
			label: 'Materials & gauge',
			present: hasMaterialsAndGauge(pattern),
			tier: 'floor',
		},
		{
			id: 'difficulty',
			label: 'Difficulty',
			present: Boolean(pattern.overview.skillLevel),
			tier: 'floor',
		},
		{
			id: 'schematic',
			label: 'Schematic',
			present: hasSchematic(pattern),
			tier: 'optional',
		},
		{
			id: 'video',
			label: 'Tutorial video',
			present: pattern.tutorials.length > 0,
			tier: 'optional',
		},
		{
			id: 'sizes',
			label: 'Multiple sizes',
			present: (pattern.overview.sizes?.length ?? 0) > 1,
			tier: 'optional',
		},
		{
			id: 'stitch-guide',
			label: 'Stitch guide',
			present: pattern.stitches.length > 0,
			tier: 'optional',
		},
		{
			id: 'abbreviations',
			label: 'US & UK terms',
			present: pattern.stitches.some((s) => s.kind === 'abbreviation'),
			tier: 'optional',
		},
	];
}

/** Minimum floor — all floor-tier checks must pass before publishing (§4.5). */
export function patternMeetsPublishFloor(pattern: Pattern): boolean {
	return patternQualityChecks(pattern)
		.filter((c) => c.tier === 'floor')
		.every((c) => c.present);
}

export function patternPublishFloorMissing(pattern: Pattern): string[] {
	return patternQualityChecks(pattern)
		.filter((c) => c.tier === 'floor' && !c.present)
		.map((c) => c.label);
}

function newPatternVersion(label: string, status: PatternVersionStatus): PatternVersion {
	const ts = nowISO();
	return {
		id: uid('ver'),
		label,
		status,
		createdAt: ts,
		updatedAt: ts,
		...(status === 'published' ? { publishedAt: ts } : {}),
	};
}

export function ensurePatternVersioning(pattern: Pattern): PatternVersioning {
	if (pattern.versioning) return pattern.versioning;
	const version = newPatternVersion('v1', 'draft');
	return {
		visibility: 'private',
		versions: [version],
		activeVersionId: version.id,
	};
}

export function setActivePatternVersion(
	pattern: Pattern,
	versionId: string,
): Pattern {
	const versioning = ensurePatternVersioning(pattern);
	if (!versioning.versions.some((v) => v.id === versionId)) return pattern;
	return {
		...pattern,
		versioning: { ...versioning, activeVersionId: versionId },
	};
}

export function publishPatternVersion(pattern: Pattern): Pattern {
	const versioning = ensurePatternVersioning(pattern);
	const draft = patternDraftVersion(pattern);
	if (!draft) return pattern;

	const versions = versioning.versions.map((v) => {
		if (v.id === draft.id) {
			return {
				...v,
				status: 'published' as const,
				publishedAt: nowISO(),
				updatedAt: nowISO(),
			};
		}
		if (v.status === 'published') {
			return { ...v, status: 'outdated' as const, updatedAt: nowISO() };
		}
		return v;
	});

	return {
		...pattern,
		versioning: {
			...versioning,
			visibility: 'published',
			versions,
			activeVersionId: draft.id,
		},
	};
}

export function createPatternDraft(pattern: Pattern): Pattern {
	const versioning = ensurePatternVersioning(pattern);
	const existing = patternDraftVersion(pattern);
	if (existing) {
		return setActivePatternVersion(pattern, existing.id);
	}

	const draft = newPatternVersion(nextPatternVersionLabel(versioning), 'draft');
	return {
		...pattern,
		versioning: {
			...versioning,
			versions: [...versioning.versions, draft],
			activeVersionId: draft.id,
		},
	};
}

export function remixPattern(pattern: Pattern): Pattern {
	const version = newPatternVersion('v1', 'draft');
	const designer = pattern.overview.designer?.name;

	return {
		...deepClone(pattern),
		id: uid('pat'),
		overview: {
			...pattern.overview,
			name: `${pattern.overview.name} (remix)`,
		},
		versioning: {
			visibility: 'private',
			versions: [version],
			activeVersionId: version.id,
		},
		lineage: {
			remixedFromPatternId: pattern.id,
			remixedFromVersionId: pattern.versioning?.activeVersionId,
			remixedFromLabel: pattern.overview.name,
			...(designer ? { remixedFromDesigner: designer } : {}),
		},
		workingCopy: { branch: 'main', dirty: false },
	};
}

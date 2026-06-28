import type {
	Component,
	ComponentArtifact,
	Material,
	Pattern,
	PatternVersion,
	SkillLevel,
} from '@threadwick/types';
export type WhatsInsideItem = {
	id: string;
	icon: 'patterns' | 'notes' | 'yarn';
	title: string;
	subtitle: string;
	href: string;
};

const SKILL_LABEL: Record<SkillLevel, string> = {
	beginner: 'Beginner',
	easy: 'Easy',
	intermediate: 'Intermediate',
	advanced: 'Advanced',
};

export function activePatternVersion(pattern: Pattern): PatternVersion | undefined {
	const versioning = pattern.versioning;
	if (!versioning) return undefined;
	return versioning.versions.find((v) => v.id === versioning.activeVersionId);
}

export function patternVisibilityLabel(pattern: Pattern): string {
	return pattern.versioning?.visibility === 'published' ? 'Published' : 'Private';
}

/** Overview state pill — e.g. "Published · editing v4" (§4.2). */
export function patternOverviewStatusLabel(pattern: Pattern): string {
	const visibility = patternVisibilityLabel(pattern);
	const version = activePatternVersion(pattern);
	if (!version) return visibility;
	const editing =
		version.status === 'draft' ? ` · editing ${version.label}` : ` · ${version.label}`;
	return `${visibility}${editing}`;
}

function yarnSummary(materials: Material[]): string | undefined {
	const yarns = materials.filter((m) => m.kind === 'yarn');
	if (yarns.length === 0) return undefined;
	const first = yarns[0];
	if (!first) return undefined;
	const weight = first.weight ?? first.label;
	const count = yarns.length;
	return count > 1 ? `${weight} · ${count} yarns` : weight;
}

function hookSummary(materials: Material[]): string | undefined {
	const hooks = materials.filter((m) => m.kind === 'hook' || m.kind === 'needle');
	if (hooks.length === 0) return undefined;
	return hooks.map((h) => h.weight ?? h.label).join(' · ');
}

function gaugeSummary(pattern: Pattern): string | undefined {
	const gaugeNote = pattern.notes.find((n) => n.kind === 'gauge');
	if (gaugeNote?.body) return gaugeNote.body.replace(/\s+/g, ' ').trim().slice(0, 40);
	return undefined;
}

function countArtifacts(components: Component[]): {
	components: number;
	charts: number;
	written: number;
	schematics: number;
} {
	let charts = 0;
	let written = 0;
	let schematics = 0;
	for (const component of components) {
		for (const artifact of component.artifacts) {
			if (artifact.type === 'chart') charts += 1;
			else if (artifact.type === 'written') written += 1;
			else if (artifact.type === 'schematic') schematics += 1;
		}
	}
	return { components: components.length, charts, written, schematics };
}

function artifactLabel(artifact: ComponentArtifact): string {
	if (artifact.type === 'chart') return 'Chart';
	if (artifact.type === 'written') return 'Written instructions';
	return 'Schematic';
}

export function patternOverviewKeyFacts(
	pattern: Pattern,
): Array<{ label: string; value: string }> {
	const facts: Array<{ label: string; value: string }> = [];
	const { overview, components, materials } = pattern;
	if (overview.skillLevel) {
		facts.push({ label: 'Difficulty', value: SKILL_LABEL[overview.skillLevel] });
	}
	const counts = countArtifacts(components);
	if (counts.components > 0) {
		facts.push({ label: 'Components', value: String(counts.components) });
	}
	const yarn = yarnSummary(materials);
	if (yarn) facts.push({ label: 'Yarn', value: yarn });
	const hook = hookSummary(materials);
	if (hook) facts.push({ label: 'Hook', value: hook });
	const gauge = gaugeSummary(pattern);
	if (gauge) facts.push({ label: 'Gauge', value: gauge });
	const rounds = counts.charts + counts.written;
	if (rounds > 0) facts.push({ label: 'Artifacts', value: String(rounds) });
	return facts;
}

export function patternWhatsInsideItems(
	patternId: string,
	pattern: Pattern,
): WhatsInsideItem[] {
	const counts = countArtifacts(pattern.components);
	const chartParts: string[] = [];
	if (counts.components > 0) {
		chartParts.push(
			`${counts.components} component${counts.components === 1 ? '' : 's'}`,
		);
	}
	if (counts.charts > 0) {
		chartParts.push(`${counts.charts} chart${counts.charts === 1 ? '' : 's'}`);
	}
	const items: WhatsInsideItem[] = [];
	if (counts.components > 0 || counts.charts > 0 || counts.written > 0) {
		items.push({
			id: 'instructions',
			icon: 'patterns',
			title: 'Chart & written instructions',
			subtitle: chartParts.join(' · ') || 'Components and artifacts',
			href: `/studio/patterns/${patternId}/components`,
		});
	}
	const yarnCount = pattern.materials.filter((m) => m.kind === 'yarn').length;
	const hookCount = pattern.materials.filter(
		(m) => m.kind === 'hook' || m.kind === 'needle',
	).length;
	const materialParts: string[] = [];
	if (yarnCount > 0) materialParts.push(`${yarnCount} yarn${yarnCount === 1 ? '' : 's'}`);
	if (hookCount > 0) materialParts.push(`${hookCount} hook${hookCount === 1 ? '' : 's'}`);
	items.push({
		id: 'materials',
		icon: 'yarn',
		title: 'Materials',
		subtitle: materialParts.join(' · ') || 'Yarns, hooks and reference',
		href: `/studio/patterns/${patternId}/materials/yarns`,
	});
	return items;
}

export function componentArtifactLinks(
	patternId: string,
	component: Component,
): Array<{ id: string; label: string; href: string; icon: 'patterns' | 'notes' }> {
	return component.artifacts.map((artifact) => ({
		id: artifact.id,
		label: artifactLabel(artifact),
		href: `/studio/patterns/${patternId}/components/${component.id}/${artifact.type}/${artifact.id}`,
		icon: artifact.type === 'written' ? 'notes' : 'patterns',
	}));
}

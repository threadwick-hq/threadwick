import { aggregateProjectProgress } from './progress';
import type { ChartPattern, Project } from './types';

export type OverviewMaterialItem = {
	id: string;
	label: string;
	fromStash?: boolean;
	acquired?: boolean;
};

/**
 * Derive the last-worked timestamp: the newest of the stored field and the
 * per-pattern progress touches. Progress advances don't write lastWorkedAt,
 * so a stored value must not shadow a newer touch.
 */
export function deriveLastWorkedAt(project: Project): string | undefined {
	let best = project.lastWorkedAt ?? '';
	for (const ref of project.makePatterns ?? []) {
		const at = ref.progress?.updatedAt ?? '';
		if (at > best) best = at;
	}
	return best || undefined;
}

export function formatDurationMs(ms: number): string {
	const totalMinutes = Math.floor(ms / 60_000);
	const hours = Math.floor(totalMinutes / 60);
	const minutes = totalMinutes % 60;
	if (hours > 0 && minutes > 0) return `${hours} h ${minutes} m`;
	if (hours > 0) return `${hours} h`;
	if (minutes > 0) return `${minutes} m`;
	return '0 m';
}

export function formatRelativeAgo(iso: string, now = Date.now()): string {
	const then = Date.parse(iso);
	if (Number.isNaN(then)) return '—';
	const diffMs = Math.max(0, now - then);
	const minutes = Math.floor(diffMs / 60_000);
	if (minutes < 1) return 'Just now';
	if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
	const days = Math.floor(hours / 24);
	return `${days} day${days === 1 ? '' : 's'} ago`;
}

export function projectOverviewMaterials(
	project: Project,
): OverviewMaterialItem[] {
	const items: OverviewMaterialItem[] = [];
	for (const yarn of project.yarns ?? []) {
		items.push({
			id: yarn.id,
			label: yarn.label,
			fromStash: Boolean(yarn.stashId),
			acquired: yarn.acquired,
		});
	}
	for (const tool of project.tools ?? []) {
		items.push({
			id: tool.id,
			label: tool.label,
			fromStash: Boolean(tool.stashId),
			acquired: tool.acquired,
		});
	}
	return items;
}

export function projectOverviewKeyFacts(
	project: Project,
	resolvePattern: (patternId: string) => ChartPattern | undefined,
): Array<{ label: string; value: string }> {
	const aggregate = aggregateProjectProgress(project, resolvePattern);
	const facts: Array<{ label: string; value: string }> = [];
	const last = deriveLastWorkedAt(project);
	if (last) {
		facts.push({ label: 'Last worked on', value: formatRelativeAgo(last) });
	}
	if (project.timeLoggedMs != null && project.timeLoggedMs > 0) {
		facts.push({
			label: 'Time logged',
			value: formatDurationMs(project.timeLoggedMs),
		});
	}
	const left = Math.max(0, aggregate.unitsTotal - aggregate.unitsDone);
	if (aggregate.unitsTotal > 0) {
		facts.push({ label: 'Units left', value: String(left) });
	}
	return facts;
}

export function projectOverviewSubtitle(project: Project): string | undefined {
	const ref = project.makePatterns?.[0];
	if (!ref) return undefined;
	const started = project.createdAt
		? formatRelativeAgo(project.createdAt)
		: undefined;
	const designer =
		ref.source !== 'threadwick' && 'designer' in ref && ref.designer
			? ` by ${ref.designer}`
			: '';
	const lead = `Making ${ref.label}${designer}`;
	return started ? `${lead} · started ${started.replace(' ago', '')}` : lead;
}

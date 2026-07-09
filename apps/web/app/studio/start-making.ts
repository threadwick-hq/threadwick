import { uid } from '@threadwick/editor/chart';
import type { Pattern } from '@threadwick/types';
import type { NavigateFunction } from 'react-router';
import { ensureStudioStore } from './studio-store';

/** Start making from a marketplace or workbench pattern — creates a Project with a ref (§4.4). */
export async function startMakingFromPattern(
	pattern: Pattern,
	navigate: NavigateFunction,
): Promise<string | null> {
	const store = await ensureStudioStore();
	const projectId = store.createProject(pattern.overview.name);
	const project = store.getProject(projectId);
	if (!project) return null;

	const ref = {
		id: uid('ref'),
		label: pattern.overview.name,
		source: 'threadwick' as const,
		patternId: pattern.id,
		patternVersionId: pattern.versioning?.activeVersionId,
		suggestedFollowMode: 'pattern' as const,
	};
	project.makePatterns = [...(project.makePatterns ?? []), ref];
	project.makerStatus = 'in-progress';
	project.updatedAt = new Date().toISOString();
	store.saveLocal();
	navigate(`/studio/projects/${projectId}`);
	return projectId;
}

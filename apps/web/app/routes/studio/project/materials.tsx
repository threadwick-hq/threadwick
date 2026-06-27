import { useParams } from 'react-router';
import { useStudioStore } from '../../../studio/studio-store';

/** Materials & notes shell placeholder — picker lands in TW-034/045. */
export default function ProjectMaterials() {
	const store = useStudioStore();
	const { projectId } = useParams<{ projectId: string }>();
	const project = store?.state.library.projects.find((candidate) => candidate.id === projectId);

	if (!store || !project) {
		return (
			<div className="px-6 py-8 text-sm text-muted-foreground">Loading materials…</div>
		);
	}

	return (
		<div className="px-6 py-8">
			<h1 className="text-2xl font-medium tracking-tight">Materials & notes</h1>
			<p className="mt-1 text-sm text-muted-foreground">
				Yarns · Tools · Notes · Photos — the stash-aware picker lands in TW-034/045.
			</p>
			<ul className="mt-6 grid max-w-md gap-2 text-sm text-muted-foreground">
				<li>Yarns</li>
				<li>Tools</li>
				<li>Notes</li>
				<li>Photos</li>
			</ul>
		</div>
	);
}

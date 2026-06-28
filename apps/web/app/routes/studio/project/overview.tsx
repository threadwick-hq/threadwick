import { Link, useParams } from 'react-router';
import { makerStatusDotClass, makerStatusLabel } from '../../../studio/maker-status';
import { useStudioStore } from '../../../studio/studio-store';

/** Overview shell placeholder — body lands in TW-034. */
export default function ProjectOverview() {
	const store = useStudioStore();
	const { projectId } = useParams<{ projectId: string }>();
	const project = store?.state.library.projects.find((candidate) => candidate.id === projectId);
	const status = project?.makerStatus ?? 'draft';

	if (!store || !project) {
		return (
			<div className="px-6 py-8 text-sm text-muted-foreground">Loading overview…</div>
		);
	}

	return (
		<div className="px-6 py-8">
			<div className="flex flex-wrap items-center gap-3">
				<h1 className="text-2xl font-medium tracking-tight">{project.name}</h1>
				<span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground">
					<span className={`size-1.5 rounded-full ${makerStatusDotClass(status)}`} aria-hidden />
					{makerStatusLabel(status)}
				</span>
			</div>
			<p className="mt-4 max-w-prose text-sm text-muted-foreground">
				Overview content — progress photos, patterns in this make, key facts, and materials — lands in
				TW-034. Use the rail to open a pattern in Follow or jump to Materials & notes.
			</p>
			{project.makePatterns?.[0] ? (
				<Link
					to={`/studio/follow/${project.id}/${project.makePatterns[0].id}`}
					className="mt-6 inline-flex text-sm text-primary underline-offset-4 hover:underline"
				>
					Open Follow for {project.makePatterns[0].label}
				</Link>
			) : null}
		</div>
	);
}

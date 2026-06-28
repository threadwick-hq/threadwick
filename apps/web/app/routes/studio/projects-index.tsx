import { Link } from 'react-router';
import { makerStatusDotClass, makerStatusLabel } from '../../studio/maker-status';
import { useStudioStore } from '../../studio/studio-store';

/** Workbench projects list — links into the project interior drill-in. */
export default function StudioProjectsIndex() {
	const store = useStudioStore();

	if (!store) {
		return (
			<div className="px-6 py-8 text-sm text-muted-foreground">Loading projects…</div>
		);
	}

	const projects = store.state.library.projects;

	return (
		<div className="px-6 py-8">
			<h1 className="text-2xl font-medium tracking-tight">Projects</h1>
			<p className="mt-1 text-sm text-muted-foreground">Your makes — open one to pick up where you left off.</p>
			{projects.length === 0 ? (
				<p className="mt-6 text-sm text-muted-foreground">No projects yet.</p>
			) : (
				<ul className="mt-6 space-y-2">
					{projects.map((project) => {
						const status = project.makerStatus ?? 'draft';
						return (
							<li key={project.id}>
								<Link
									to={`/studio/projects/${project.id}`}
									className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:bg-muted/40"
								>
									<span
										className={`size-2 shrink-0 rounded-full ${makerStatusDotClass(status)}`}
										aria-hidden
									/>
									<span className="min-w-0 flex-1">
										<span className="block truncate font-medium">{project.name}</span>
										<span className="text-xs text-muted-foreground">
											{makerStatusLabel(status)}
											{(project.makePatterns?.length ?? 0) > 0
												? ` · ${project.makePatterns!.length} pattern${project.makePatterns!.length === 1 ? '' : 's'}`
												: ''}
										</span>
									</span>
								</Link>
							</li>
						);
					})}
				</ul>
			)}
		</div>
	);
}

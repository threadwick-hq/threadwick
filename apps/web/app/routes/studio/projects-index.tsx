import {
	CardGrid,
	EmptyState,
	PhotoCard,
	type PhotoCardMedia,
} from '@threadwick/core/components';
import {
	deriveLastWorkedAt,
	formatRelativeAgoSentence,
	type Project,
} from '@threadwick/editor';
import { Link } from 'react-router';
import { projectInScope, useCraftScope } from '../../studio/craft-scope';
import { makerStatusLabel } from '../../studio/maker-status';
import { useStudioStore } from '../../studio/studio-store';

/** Workbench projects list — your makes, drilling into the project interior. */
export default function StudioProjectsIndex() {
	const store = useStudioStore();
	const { scope } = useCraftScope();

	if (!store) {
		return (
			<div className="px-6 py-8 text-sm text-muted-foreground">
				Loading projects…
			</div>
		);
	}

	const projects = store.state.library.projects.filter((project) =>
		projectInScope(scope, project),
	);

	return (
		<div className="px-6 py-8">
			<h1 className="text-2xl font-medium tracking-tight">Projects</h1>
			<p className="mt-1 text-sm text-muted-foreground">
				{projects.length} project{projects.length === 1 ? '' : 's'} — your
				makes; open one to pick up where you left off.
			</p>

			{projects.length === 0 ? (
				<EmptyState
					className="mt-6"
					title="No projects yet"
					description="Start making a pattern and your project will appear here."
				/>
			) : (
				<CardGrid className="mt-6">
					{projects.map((project) => {
						const photo = project.photos?.[0]?.image;
						// non-empty src only — an empty string would render a broken <img>
						const media: PhotoCardMedia = photo?.src.trim()
							? { photoUrl: photo.src, photoAlt: photo.alt ?? '' }
							: {};
						return (
							<Link
								key={project.id}
								to={`/studio/projects/${project.id}`}
								aria-label={`Open ${project.name}`}
								className="block rounded-xl"
							>
								<PhotoCard
									title={project.name}
									subtitle={projectStateLine(project)}
									badge={makerStatusLabel(project.makerStatus ?? 'draft')}
									{...media}
								/>
							</Link>
						);
					})}
				</CardGrid>
			)}
		</div>
	);
}

function projectStateLine(project: Project): string {
	const workedAt = deriveLastWorkedAt(project);
	const patternCount = project.makePatterns?.length ?? 0;
	const counts =
		patternCount > 0
			? `${patternCount} pattern${patternCount === 1 ? '' : 's'}`
			: undefined;
	const worked = workedAt
		? `Worked on ${formatRelativeAgoSentence(workedAt)}`
		: undefined;
	return [worked, counts].filter(Boolean).join(' · ') || 'Not started yet';
}

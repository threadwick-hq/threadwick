import {
	KeyFactsGrid,
	MaterialsChecklist,
	PatternsInMake,
	ProgressPhotoGallery,
	ProjectOverviewHeader,
} from '@threadwick/core/components';
import {
	aggregateProjectProgress,
	continueMakingRef,
	type Project,
	projectOverviewKeyFacts,
	projectOverviewMaterials,
	projectOverviewSubtitle,
} from '@threadwick/editor';
import { Link, useParams } from 'react-router';
import {
	makerStatusDotClass,
	makerStatusLabel,
	patternSourceLabel,
	refProgressPercent,
} from '../../../studio/maker-status';
import { useStudioStore } from '../../../studio/studio-store';

function resolvePatternInProject(project: Project, patternId: string) {
	for (const version of project.versions) {
		const pattern = version.patterns.find(
			(candidate) => candidate.id === patternId,
		);
		if (pattern) return pattern;
	}
	return undefined;
}

export default function ProjectOverview() {
	const store = useStudioStore();
	const { projectId } = useParams<{ projectId: string }>();
	const project = store?.state.library.projects.find(
		(candidate) => candidate.id === projectId,
	);
	const status = project?.makerStatus ?? 'draft';

	if (!store || !project || !projectId) {
		return (
			<div className="px-6 py-8 text-sm text-muted-foreground">
				Loading overview…
			</div>
		);
	}

	const resolvePattern = (patternId: string) =>
		resolvePatternInProject(project, patternId);
	const aggregate = aggregateProjectProgress(project, resolvePattern);
	const continueRef = continueMakingRef(project);
	const continueHref = continueRef
		? `/studio/follow/${projectId}/${continueRef.id}`
		: undefined;
	const patterns = (project.makePatterns ?? []).map((ref) => ({
		id: ref.id,
		label: ref.label,
		sourceLabel: patternSourceLabel(ref.source),
		percent: refProgressPercent(ref),
		progressLabel:
			ref.progress?.unitsTotal != null
				? `${ref.progress.unitsDone ?? 0} of ${ref.progress.unitsTotal} units`
				: 'Progress',
		followHref: `/studio/follow/${projectId}/${ref.id}`,
	}));
	const photos = (project.photos ?? []).map((photo) => ({
		id: photo.id,
		src: photo.image.src || undefined,
		alt: photo.image.alt,
	}));
	const materials = projectOverviewMaterials(project);
	const keyFacts = projectOverviewKeyFacts(project, resolvePattern);

	return (
		<div className="px-6 py-8">
			<ProjectOverviewHeader
				title={project.name}
				statusLabel={makerStatusLabel(status)}
				statusDotClassName={makerStatusDotClass(status)}
				subtitle={projectOverviewSubtitle(project)}
			/>

			<div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start">
				<ProgressPhotoGallery photos={photos} className="lg:shrink-0" />
				<div className="min-w-0 flex-1 space-y-3">
					<div>
						<div className="mb-1 flex items-center justify-between gap-2 text-sm text-muted-foreground">
							<span>
								{aggregate.unitsTotal > 0
									? `${aggregate.unitsDone} of ${aggregate.unitsTotal} units`
									: 'Overall progress'}
							</span>
							<span className="tabular-nums">{aggregate.percent}%</span>
						</div>
						<div
							className="h-1.5 overflow-hidden rounded-full bg-muted"
							role="progressbar"
							aria-valuenow={aggregate.percent}
							aria-valuemin={0}
							aria-valuemax={100}
							aria-label="Overall project progress"
						>
							<div
								className="h-full rounded-full bg-primary transition-[width] duration-200"
								style={{ width: `${aggregate.percent}%` }}
							/>
						</div>
					</div>
					{continueHref ? (
						<Link
							to={continueHref}
							className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
						>
							Continue making
						</Link>
					) : null}
				</div>
			</div>

			<KeyFactsGrid facts={keyFacts} className="mt-4 max-w-xl" />

			<section className="mt-6">
				<h2 className="mb-2 text-[11px] uppercase tracking-wide text-muted-foreground">
					Patterns in this make
				</h2>
				<PatternsInMake
					patterns={patterns}
					continueHref={continueHref}
					linkComponent={({ to, className, children }) => (
						<Link to={to} className={className}>
							{children}
						</Link>
					)}
				/>
			</section>

			<MaterialsChecklist items={materials} className="mt-6" />
		</div>
	);
}

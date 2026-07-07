import { isRavelryEnabled } from '@threadwick/core/capabilities';
import {
	InteriorIdentityTile,
	PinnedStatusContinueButton,
	PinnedStatusTile,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@threadwick/core/components';
import {
	aggregateProjectProgress,
	continueMakingRef,
	type Project,
} from '@threadwick/editor';
import { Icon } from '@threadwick/icons';
import type { MakerStatus, PatternReference } from '@threadwick/types';
import { useCallback, useEffect, useMemo } from 'react';
import { Link, Outlet, useParams } from 'react-router';
import { InteriorChromeSlot } from './interior-chrome';
import {
	MAKER_STATUS_OPTIONS,
	makerStatusDotClass,
	makerStatusLabel,
	patternSourceLabel,
	refProgressPercent,
} from './maker-status';
import { ProjectInteriorBreadcrumb } from './project-breadcrumb';
import {
	ProjectRailAddButton,
	ProjectRailLink,
	ProjectRailSectionLabel,
} from './project-rail';
import {
	pullProjectStatusFromRavelry,
	pushProjectStatusToRavelry,
} from './ravelry-sync';
import { type StudioStore, useStudioStore } from './studio-store';

function resolvePatternInProject(project: Project, patternId: string) {
	for (const version of project.versions) {
		const pattern = version.patterns.find(
			(candidate) => candidate.id === patternId,
		);
		if (pattern) return pattern;
	}
	return undefined;
}

function ProjectStatusSelector({
	status,
	onStatusChange,
}: {
	status: MakerStatus;
	onStatusChange: (status: MakerStatus) => void;
}) {
	return (
		<Select
			value={status}
			onValueChange={(value) => onStatusChange(value as MakerStatus)}
		>
			<SelectTrigger
				className="h-8 border-0 bg-transparent px-0 shadow-none focus:ring-0"
				aria-label="Project status"
			>
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				{MAKER_STATUS_OPTIONS.map((option) => (
					<SelectItem key={option} value={option}>
						<span className="flex items-center gap-2">
							<span
								className={`size-1.5 rounded-full ${makerStatusDotClass(option)}`}
								aria-hidden
							/>
							{makerStatusLabel(option)}
						</span>
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}

function PatternRailLinks({
	projectId,
	patterns,
}: {
	projectId: string;
	patterns: PatternReference[];
}) {
	if (patterns.length === 0) {
		return (
			<p className="px-2 py-1 text-[12px] text-muted-foreground">
				No patterns in this make yet.
			</p>
		);
	}
	return (
		<ul className="space-y-0.5">
			{patterns.map((ref) => (
				<li key={ref.id}>
					<ProjectRailLink
						to={`/studio/follow/${projectId}/${ref.id}`}
						icon="patterns"
						label={ref.label}
						meta={patternSourceLabel(ref.source)}
						count={refProgressPercent(ref)}
					/>
				</li>
			))}
		</ul>
	);
}

function ProjectInteriorChrome({
	project,
	projectId,
}: {
	project: Project;
	projectId: string;
}) {
	const store = useStudioStore();
	if (!store) return null;
	return (
		<ProjectInteriorChromeContent
			store={store}
			project={project}
			projectId={projectId}
		/>
	);
}

function ProjectInteriorChromeContent({
	store,
	project,
	projectId,
}: {
	store: StudioStore;
	project: Project;
	projectId: string;
}) {
	const status: MakerStatus = project.makerStatus ?? 'draft';

	const handleStatusChange = useCallback(
		(next: MakerStatus) => {
			store.updateProject(projectId, { makerStatus: next });
			if (isRavelryEnabled() && project.ravelryProjectId) {
				pushProjectStatusToRavelry(project.ravelryProjectId, next);
			}
			store.saveLocal();
		},
		[project.ravelryProjectId, projectId, store],
	);

	useEffect(() => {
		if (!isRavelryEnabled() || !project.ravelryProjectId) return;
		const remote = pullProjectStatusFromRavelry(project.ravelryProjectId);
		if (remote && remote !== (project.makerStatus ?? 'draft')) {
			store.updateProject(projectId, { makerStatus: remote });
			store.saveLocal();
		}
	}, [project.makerStatus, project.ravelryProjectId, projectId, store]);

	const patterns = project.makePatterns ?? [];
	const resolvePattern = (patternId: string) =>
		resolvePatternInProject(project, patternId);
	const aggregate = aggregateProjectProgress(project, resolvePattern);
	const continueRef = continueMakingRef(project);
	const continueHref = continueRef
		? `/studio/follow/${projectId}/${continueRef.id}`
		: undefined;

	const chrome = useMemo(
		() => ({
			identityTile: (
				<InteriorIdentityTile
					title={project.name}
					statusLabel={makerStatusLabel(status)}
					statusDotClassName={makerStatusDotClass(status)}
				/>
			),
			breadcrumb: <ProjectInteriorBreadcrumb projectName={project.name} />,
			rail: (
				<nav
					aria-label="Project sections"
					className="flex min-h-0 flex-1 flex-col px-2 py-2"
				>
					<ProjectRailLink
						to={`/studio/projects/${projectId}`}
						icon="home"
						label="Overview"
						end
					/>
					<ProjectRailSectionLabel>Patterns</ProjectRailSectionLabel>
					<PatternRailLinks projectId={projectId} patterns={patterns} />
					<div className="mt-2">
						<ProjectRailLink
							to={`/studio/projects/${projectId}/materials`}
							icon="notes"
							label="Materials & notes"
						/>
					</div>
					<div className="mt-2">
						<ProjectRailAddButton />
					</div>
				</nav>
			),
			pinnedTile: (
				<PinnedStatusTile
					statusSelector={
						<div className="flex items-center gap-2 text-[12.5px]">
							<span
								className={`size-1.5 shrink-0 rounded-full ${makerStatusDotClass(status)}`}
								aria-hidden
							/>
							<div className="min-w-0 flex-1">
								<ProjectStatusSelector
									status={status}
									onStatusChange={handleStatusChange}
								/>
							</div>
						</div>
					}
					percent={aggregate.percent}
					progressLabel={
						aggregate.unitsTotal > 0
							? `${aggregate.unitsDone} of ${aggregate.unitsTotal} units`
							: 'Overall progress'
					}
					continueAction={
						continueHref ? (
							<Link to={continueHref} className="block">
								<PinnedStatusContinueButton>
									<Icon name="confirm" label="" className="size-4" />
									Continue making
								</PinnedStatusContinueButton>
							</Link>
						) : (
							<PinnedStatusContinueButton disabled>
								<Icon name="confirm" label="" className="size-4" />
								Continue making
							</PinnedStatusContinueButton>
						)
					}
				/>
			),
		}),
		[
			aggregate.percent,
			aggregate.unitsDone,
			aggregate.unitsTotal,
			continueHref,
			handleStatusChange,
			patterns,
			project.name,
			projectId,
			status,
		],
	);

	return <InteriorChromeSlot chrome={chrome} />;
}

export function ProjectInteriorMount() {
	const store = useStudioStore();
	const { projectId } = useParams<{ projectId: string }>();

	if (!store) {
		return (
			<div className="px-6 py-8 text-sm text-muted-foreground">
				Loading project…
			</div>
		);
	}

	if (!projectId) {
		return (
			<div className="px-6 py-8 text-sm text-muted-foreground">
				Missing project id.
			</div>
		);
	}

	const project = store.state.library.projects.find(
		(candidate) => candidate.id === projectId,
	);
	if (!project) {
		return (
			<div className="px-6 py-8">
				<p className="text-sm text-muted-foreground">Project not found.</p>
				<Link
					to="/studio/projects"
					className="mt-2 inline-block text-sm text-primary underline-offset-4 hover:underline"
				>
					Back to projects
				</Link>
			</div>
		);
	}

	return (
		<>
			<ProjectInteriorChrome project={project} projectId={projectId} />
			<Outlet />
		</>
	);
}

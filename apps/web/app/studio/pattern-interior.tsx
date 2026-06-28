import {
	Button,
	InteriorIdentityTile,
	PinnedVersionTile,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@threadwick/core/components';
import {
	activePatternVersion,
	componentArtifactLinks,
	patternMeetsPublishFloor,
	patternPublishAction,
	patternPublishActionLabel,
	patternPublishFloorMissing,
	patternVersionStatusLabel,
	patternVisibilityLabel,
} from '@threadwick/editor';
import type { Pattern } from '@threadwick/types';
import { Icon } from '@threadwick/icons';
import { useCallback, useMemo } from 'react';
import { Link, Outlet, useNavigate, useParams } from 'react-router';
import { InteriorChromeSlot } from './interior-chrome';
import { PatternInteriorBreadcrumb } from './pattern-breadcrumb';
import {
	publishPattern,
	remixWorkbenchPattern,
	setPatternActiveVersion,
	startPatternDraft,
	usePattern,
} from './pattern-store';
import {
	ProjectRailAddButton,
	ProjectRailLink,
	ProjectRailSectionLabel,
} from './project-rail';

function visibilityDotClass(pattern: Pattern): string {
	return pattern.versioning?.visibility === 'published' ? 'bg-emerald-500' : 'bg-muted-foreground';
}

function PatternVersionTile({
	pattern,
	patternId,
}: {
	pattern: Pattern;
	patternId: string;
}) {
	const navigate = useNavigate();
	const version = activePatternVersion(pattern);
	const versionLabel = version?.label ?? 'v1';
	const versionStatus = version ? patternVersionStatusLabel(version.status) : 'draft';
	const publishAction = patternPublishAction(pattern);
	const publishLabel = patternPublishActionLabel(publishAction);
	const canPublish =
		publishAction === 'new-draft' || patternMeetsPublishFloor(pattern);
	const floorMissing = patternPublishFloorMissing(pattern);

	const versions = useMemo(
		() =>
			(pattern.versioning?.versions ?? []).map((v) => ({
				id: v.id,
				label: v.label,
				status: patternVersionStatusLabel(v.status),
			})),
		[pattern.versioning?.versions],
	);

	const handlePublish = useCallback(() => {
		if (publishAction === 'new-draft') {
			startPatternDraft(patternId);
			return;
		}
		if (!canPublish) return;
		publishPattern(patternId);
	}, [canPublish, patternId, publishAction]);

	const handleRemix = useCallback(() => {
		const remixed = remixWorkbenchPattern(patternId);
		if (remixed) navigate(`/studio/patterns/${remixed.id}`);
	}, [navigate, patternId]);

	const publishButton = (
		<Button
			type="button"
			className="h-8 flex-1 text-[11.5px]"
			disabled={!canPublish}
			onClick={handlePublish}
		>
			{publishLabel}
		</Button>
	);

	return (
		<PinnedVersionTile
			versionLabel={versionLabel}
			versionStatus={versionStatus}
			versions={versions}
			activeVersionId={pattern.versioning?.activeVersionId}
			onVersionChange={(versionId) => setPatternActiveVersion(patternId, versionId)}
			primaryAction={
				canPublish || floorMissing.length === 0 ? (
					publishButton
				) : (
					<Tooltip>
						<TooltipTrigger asChild>
							<span className="flex flex-1">{publishButton}</span>
						</TooltipTrigger>
						<TooltipContent side="top" className="max-w-[14rem] text-xs">
							Add {floorMissing.join(', ').toLowerCase()} to publish.
						</TooltipContent>
					</Tooltip>
				)
			}
			secondaryAction={
				<Button
					type="button"
					variant="outline"
					className="h-8 px-3 text-[11.5px]"
					onClick={handleRemix}
				>
					Remix
				</Button>
			}
		/>
	);
}

function PatternInteriorChrome({
	pattern,
	patternId,
}: {
	pattern: Pattern;
	patternId: string;
}) {
	const chrome = useMemo(
		() => ({
			identityTile: (
				<InteriorIdentityTile
					title={pattern.overview.name}
					statusLabel={patternVisibilityLabel(pattern)}
					statusDotClassName={visibilityDotClass(pattern)}
					settingsLabel="Pattern settings"
					leading={
						<span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground [&_svg]:size-4">
							<Icon name="patterns" label="" />
						</span>
					}
				/>
			),
			breadcrumb: <PatternInteriorBreadcrumb patternName={pattern.overview.name} />,
			rail: (
				<nav aria-label="Pattern sections" className="flex min-h-0 flex-1 flex-col px-2 py-2">
					<ProjectRailLink
						to={`/studio/patterns/${patternId}`}
						icon="home"
						label="Overview"
						end
					/>
					<ProjectRailSectionLabel>
						<span className="flex w-full items-center">
							Components
							<span className="ml-auto tabular-nums">{pattern.components.length}</span>
							<Icon name="add" label="" className="ml-1.5 size-3.5 opacity-60" />
						</span>
					</ProjectRailSectionLabel>
					<ul className="space-y-0.5">
						{pattern.components.map((component) => (
							<li key={component.id}>
								<ProjectRailLink
									to={`/studio/patterns/${patternId}/components/${component.id}`}
									icon="patterns"
									label={component.name}
								/>
								<ul className="ml-5 space-y-0.5 border-l border-border pl-2">
									{componentArtifactLinks(patternId, component).map((artifact) => (
										<li key={artifact.id}>
											<ProjectRailLink
												to={artifact.href}
												icon={artifact.icon}
												label={artifact.label}
												className="text-[12px]"
											/>
										</li>
									))}
								</ul>
							</li>
						))}
					</ul>
					<div className="mt-1">
						<ProjectRailAddButton />
					</div>
					<ProjectRailSectionLabel>Materials & reference</ProjectRailSectionLabel>
					<ProjectRailLink
						to={`/studio/patterns/${patternId}/materials/yarns`}
						icon="yarn"
						label="Yarns & hooks"
						meta={String(pattern.materials.length)}
					/>
					<ProjectRailLink
						to={`/studio/patterns/${patternId}/materials/tutorials`}
						icon="view"
						label="Tutorials & videos"
						meta={String(pattern.tutorials.length)}
					/>
					<ProjectRailLink
						to={`/studio/patterns/${patternId}/materials/stitches`}
						icon="symbols"
						label="Special stitches"
						meta={String(pattern.stitches.length)}
					/>
					<ProjectRailLink
						to={`/studio/patterns/${patternId}/materials/notes`}
						icon="notes"
						label="Notes"
						meta={String(pattern.notes.length)}
					/>
				</nav>
			),
			pinnedTile: <PatternVersionTile pattern={pattern} patternId={patternId} />,
		}),
		[pattern, patternId],
	);

	return <InteriorChromeSlot chrome={chrome} />;
}

export function PatternInteriorMount() {
	const { patternId } = useParams<{ patternId: string }>();
	const pattern = usePattern(patternId);

	if (!patternId) {
		return (
			<div className="px-6 py-8 text-sm text-muted-foreground">Missing pattern id.</div>
		);
	}

	if (!pattern) {
		return (
			<div className="px-6 py-8">
				<p className="text-sm text-muted-foreground">Pattern not found.</p>
				<Link
					to="/studio/patterns"
					className="mt-2 inline-block text-sm text-primary underline-offset-4 hover:underline"
				>
					Back to patterns
				</Link>
			</div>
		);
	}

	return (
		<>
			<PatternInteriorChrome pattern={pattern} patternId={patternId} />
			<Outlet />
		</>
	);
}

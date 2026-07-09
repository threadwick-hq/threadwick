import {
	InteriorIdentityTile,
	PinnedVersionTile,
} from '@threadwick/core/interior';
import {
	Badge,
	Button,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@threadwick/core/ui';
import type { PatternListing } from '@threadwick/editor/follow';
import {
	activePatternVersion,
	componentArtifactLinks,
	formatPatternPrice,
	patternMeetsPublishFloor,
	patternPublishAction,
	patternPublishActionLabel,
	patternPublishFloorMissing,
	patternVersionStatusLabel,
	patternVisibilityLabel,
} from '@threadwick/editor/follow';
import { Icon } from '@threadwick/icons';
import type { Pattern, PatternOwnership } from '@threadwick/types';
import { useCallback, useMemo } from 'react';
import { Link, Outlet, useNavigate, useParams } from 'react-router';
import { InteriorChromeSlot } from './interior-chrome';
import { PatternInteriorBreadcrumb } from './pattern-breadcrumb';
import { usePatternInteriorMode, usePatternPaidDemo } from './pattern-mode';
import {
	getPatternListing,
	getPatternOwnership,
	isPatternBookmarked,
	purchasePattern,
	resolveViewPattern,
	setPatternBookmarked,
	usePatternMarketplaceState,
} from './pattern-ownership-store';
import {
	publishPattern,
	remixCatalogPattern,
	remixWorkbenchPattern,
	setPatternActiveVersion,
	startPatternDraft,
	usePattern,
} from './pattern-store';
import { PatternViewBreadcrumb } from './pattern-view-breadcrumb';
import {
	ProjectRailAddButton,
	ProjectRailLink,
	ProjectRailSectionLabel,
} from './project-rail';
import { startMakingFromPattern } from './start-making';

export type PatternInteriorOutletContext = {
	mode: 'view' | 'edit';
	listing?: PatternListing;
	ownership?: PatternOwnership;
	onStartMaking?: () => void;
	onRemix?: () => void;
};

function visibilityDotClass(pattern: Pattern): string {
	return pattern.versioning?.visibility === 'published'
		? 'bg-emerald-500'
		: 'bg-muted-foreground';
}

function viewPricePillLabel(
	listing: PatternListing,
	ownership: PatternOwnership,
): string {
	if (ownership.owned && listing.priceCents > 0) return 'Owned';
	return formatPatternPrice(listing);
}

function PatternViewIdentityTile({
	pattern,
	listing,
	ownership,
	bookmarked,
	onToggleBookmark,
}: {
	pattern: Pattern;
	listing: PatternListing;
	ownership: PatternOwnership;
	bookmarked: boolean;
	onToggleBookmark: () => void;
}) {
	const handle = listing.handle ?? pattern.overview.designer?.name;
	return (
		<div className="flex w-full min-w-0 items-center gap-2 rounded-md border border-border px-2 py-1.5">
			<span className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted text-muted-foreground [&_svg]:size-4">
				{pattern.overview.cover?.src ? (
					<img
						src={pattern.overview.cover.src}
						alt=""
						className="size-full object-cover"
					/>
				) : (
					<Icon name="preview" label="" />
				)}
			</span>
			<span className="min-w-0 flex-1">
				<span className="block truncate text-[13px] font-medium leading-tight">
					{pattern.overview.name}
				</span>
				{handle ? (
					<span className="block truncate text-[11px] text-muted-foreground">
						{handle}
					</span>
				) : null}
			</span>
			<Badge
				variant="secondary"
				className="h-5 shrink-0 px-1.5 text-[10.5px] font-normal"
			>
				{viewPricePillLabel(listing, ownership)}
			</Badge>
			<Button
				type="button"
				variant="ghost"
				size="icon"
				className="size-7 shrink-0 text-muted-foreground"
				onClick={onToggleBookmark}
				aria-label={bookmarked ? 'Remove bookmark' : 'Save pattern'}
				aria-pressed={bookmarked}
			>
				<Icon name="wishlist" label="" className="size-4" />
			</Button>
		</div>
	);
}

function PatternVersionSwitcherTile({
	pattern,
	patternId,
	showActions,
	onRemix,
}: {
	pattern: Pattern;
	patternId: string;
	showActions: boolean;
	onRemix?: () => void;
}) {
	const navigate = useNavigate();
	const version = activePatternVersion(pattern);
	const versionLabel = version?.label ?? 'v1';
	const versionStatus = version
		? patternVersionStatusLabel(version.status)
		: 'draft';
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
		if (onRemix) {
			onRemix();
			return;
		}
		const remixed = remixWorkbenchPattern(patternId);
		if (remixed) navigate(`/studio/patterns/${remixed.id}`);
	}, [navigate, onRemix, patternId]);

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
			showActions={showActions}
			versionLabel={versionLabel}
			versionStatus={versionStatus}
			versions={versions}
			activeVersionId={pattern.versioning?.activeVersionId}
			onVersionChange={(versionId) =>
				setPatternActiveVersion(patternId, versionId)
			}
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

function PatternInteriorRail({
	pattern,
	patternId,
	viewMode,
}: {
	pattern: Pattern;
	patternId: string;
	viewMode: boolean;
}) {
	return (
		<nav
			aria-label="Pattern sections"
			className="flex min-h-0 flex-1 flex-col px-2 py-2"
		>
			<ProjectRailLink
				to={
					viewMode
						? `/studio/patterns/${patternId}?view=1`
						: `/studio/patterns/${patternId}`
				}
				icon="home"
				label="Overview"
				end
			/>
			<ProjectRailSectionLabel>
				<span className="flex w-full items-center">
					Components
					<span className="ml-auto tabular-nums">
						{pattern.components.length}
					</span>
					{viewMode ? null : (
						<Icon name="add" label="" className="ml-1.5 size-3.5 opacity-60" />
					)}
				</span>
			</ProjectRailSectionLabel>
			<ul className="space-y-0.5">
				{pattern.components.map((component) => (
					<li key={component.id}>
						<ProjectRailLink
							to={`/studio/patterns/${patternId}/components/${component.id}${viewMode ? '?view=1' : ''}`}
							icon="patterns"
							label={component.name}
						/>
						<ul className="ml-5 space-y-0.5 border-l border-border pl-2">
							{componentArtifactLinks(patternId, component).map((artifact) => (
								<li key={artifact.id}>
									<ProjectRailLink
										to={`${artifact.href}${viewMode ? '?view=1' : ''}`}
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
			{viewMode ? null : (
				<div className="mt-1">
					<ProjectRailAddButton />
				</div>
			)}
			<ProjectRailSectionLabel>Materials & reference</ProjectRailSectionLabel>
			<ProjectRailLink
				to={`/studio/patterns/${patternId}/materials/yarns${viewMode ? '?view=1' : ''}`}
				icon="yarn"
				label="Yarns & hooks"
				meta={String(pattern.materials.length)}
			/>
			<ProjectRailLink
				to={`/studio/patterns/${patternId}/materials/tutorials${viewMode ? '?view=1' : ''}`}
				icon="view"
				label="Tutorials & videos"
				meta={String(pattern.tutorials.length)}
			/>
			<ProjectRailLink
				to={`/studio/patterns/${patternId}/materials/stitches${viewMode ? '?view=1' : ''}`}
				icon="symbols"
				label="Special stitches"
				meta={String(pattern.stitches.length)}
			/>
			<ProjectRailLink
				to={`/studio/patterns/${patternId}/materials/notes${viewMode ? '?view=1' : ''}`}
				icon="notes"
				label="Notes"
				meta={String(pattern.notes.length)}
			/>
		</nav>
	);
}

function PatternEditChrome({
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
			breadcrumb: (
				<PatternInteriorBreadcrumb patternName={pattern.overview.name} />
			),
			rail: (
				<PatternInteriorRail
					pattern={pattern}
					patternId={patternId}
					viewMode={false}
				/>
			),
			pinnedTile: (
				<PatternVersionSwitcherTile
					pattern={pattern}
					patternId={patternId}
					showActions
				/>
			),
		}),
		[pattern, patternId],
	);

	return <InteriorChromeSlot chrome={chrome} />;
}

function PatternViewChrome({
	pattern,
	patternId,
	listing,
	ownership,
	bookmarked,
	onToggleBookmark,
	onRemix,
}: {
	pattern: Pattern;
	patternId: string;
	listing: PatternListing;
	ownership: PatternOwnership;
	bookmarked: boolean;
	onToggleBookmark: () => void;
	onRemix: () => void;
}) {
	const chrome = useMemo(
		() => ({
			identityTile: (
				<PatternViewIdentityTile
					pattern={pattern}
					listing={listing}
					ownership={ownership}
					bookmarked={bookmarked}
					onToggleBookmark={onToggleBookmark}
				/>
			),
			breadcrumb: <PatternViewBreadcrumb patternName={pattern.overview.name} />,
			rail: (
				<PatternInteriorRail pattern={pattern} patternId={patternId} viewMode />
			),
			pinnedTile: (
				<PatternVersionSwitcherTile
					pattern={pattern}
					patternId={patternId}
					showActions={false}
					onRemix={onRemix}
				/>
			),
		}),
		[
			bookmarked,
			listing,
			onRemix,
			onToggleBookmark,
			ownership,
			pattern,
			patternId,
		],
	);

	return <InteriorChromeSlot chrome={chrome} />;
}

export function PatternInteriorMount() {
	const { patternId } = useParams<{ patternId: string }>();
	const mode = usePatternInteriorMode();
	const paidDemo = usePatternPaidDemo();
	const navigate = useNavigate();
	usePatternMarketplaceState();

	const workbenchPattern = usePattern(mode === 'edit' ? patternId : undefined);
	const viewPattern =
		mode === 'view' && patternId ? resolveViewPattern(patternId) : undefined;
	const pattern = mode === 'view' ? viewPattern : workbenchPattern;

	const listing =
		mode === 'view' && patternId
			? getPatternListing(patternId, { paidDemo })
			: undefined;
	const ownership =
		mode === 'view' && patternId ? getPatternOwnership(patternId) : undefined;
	const bookmarked = patternId ? isPatternBookmarked(patternId) : false;

	const onToggleBookmark = useCallback(() => {
		if (!patternId) return;
		setPatternBookmarked(patternId, !isPatternBookmarked(patternId));
	}, [patternId]);

	const onRemix = useCallback(() => {
		if (!pattern) return;
		const remixed =
			mode === 'view'
				? remixCatalogPattern(pattern)
				: remixWorkbenchPattern(pattern.id);
		if (remixed) navigate(`/studio/patterns/${remixed.id}`);
	}, [mode, navigate, pattern]);

	const onStartMaking = useCallback(async () => {
		if (!pattern || !patternId || !listing || !ownership) return;
		if (!ownership.owned && listing.priceCents > 0) {
			purchasePattern(patternId);
		}
		await startMakingFromPattern(pattern, navigate);
	}, [listing, navigate, ownership, pattern, patternId]);

	const outletContext = useMemo<PatternInteriorOutletContext>(
		() => ({
			mode,
			listing,
			ownership,
			onStartMaking: mode === 'view' ? onStartMaking : undefined,
			onRemix: mode === 'view' ? onRemix : undefined,
		}),
		[listing, mode, onRemix, onStartMaking, ownership],
	);

	if (!patternId) {
		return (
			<div className="px-6 py-8 text-sm text-muted-foreground">
				Missing pattern id.
			</div>
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

	if (mode === 'view' && listing && ownership) {
		return (
			<>
				<PatternViewChrome
					pattern={pattern}
					patternId={patternId}
					listing={listing}
					ownership={ownership}
					bookmarked={bookmarked}
					onToggleBookmark={onToggleBookmark}
					onRemix={onRemix}
				/>
				<Outlet context={outletContext} />
			</>
		);
	}

	return (
		<>
			<PatternEditChrome pattern={pattern} patternId={patternId} />
			<Outlet context={outletContext} />
		</>
	);
}

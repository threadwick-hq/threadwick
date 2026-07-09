import {
	EditableDescription,
	KeyFactsGrid,
	PatternCreatorAttribution,
	PatternMakerActions,
	PatternOverviewHeader,
	PatternQualityChecks,
	PatternQualityIncluded,
	PatternViewRating,
	ProgressPhotoGallery,
	WhatsInsideList,
} from '@threadwick/core/overview';
import {
	formatPatternPrice,
	patternMakerPrimaryAction,
	patternMakerPrimaryActionLabel,
	patternOverviewKeyFacts,
	patternOverviewStatusLabel,
	patternQualityChecks,
	patternQualityIncluded,
	patternWhatsInsideItems,
} from '@threadwick/editor/follow';
import { Icon } from '@threadwick/icons';
import { Link, useOutletContext, useParams } from 'react-router';
import type { PatternInteriorOutletContext } from '../../../studio/pattern-interior';
import { usePatternInteriorMode } from '../../../studio/pattern-mode';
import { resolveViewPattern } from '../../../studio/pattern-ownership-store';
import {
	updatePatternOverview,
	usePattern,
} from '../../../studio/pattern-store';

function PatternViewOverview({
	pattern,
	patternId,
	ctx,
}: {
	pattern: NonNullable<ReturnType<typeof resolveViewPattern>>;
	patternId: string;
	ctx: PatternInteriorOutletContext;
}) {
	const { listing, ownership, onStartMaking, onRemix } = ctx;
	if (!listing || !ownership || !onStartMaking || !onRemix) {
		return (
			<div className="px-6 py-8 text-sm text-muted-foreground">
				Loading marketplace view…
			</div>
		);
	}

	const photos = (pattern.overview.gallery ?? []).map((photo, index) => ({
		id: `gallery-${index}`,
		src: photo.src || undefined,
		alt: photo.alt,
	}));
	const keyFacts = patternOverviewKeyFacts(pattern);
	const whatsInside = patternWhatsInsideItems(patternId, pattern);
	const included = patternQualityIncluded(pattern);
	const primaryAction = patternMakerPrimaryAction(listing, ownership);
	const primaryLabel = patternMakerPrimaryActionLabel(primaryAction, listing);
	const designerName = pattern.overview.designer?.name ?? 'Unknown designer';

	return (
		<div className="px-6 py-8">
			<ProgressPhotoGallery className="gap-2" photos={photos} />

			<div className="mt-4 flex flex-wrap items-center gap-3">
				<h1 className="text-[22px] font-medium tracking-tight">
					{pattern.overview.name}
				</h1>
				{listing.rating != null && listing.reviewCount != null ? (
					<PatternViewRating
						rating={listing.rating}
						reviewCount={listing.reviewCount}
					/>
				) : null}
			</div>

			<PatternCreatorAttribution
				className="mt-2"
				name={designerName}
				handle={listing.handle}
				followerCount={listing.followerCount}
				onFollow={() => undefined}
			/>

			<PatternMakerActions
				className="mt-4"
				priceLabel={formatPatternPrice(listing)}
				primaryLabel={primaryLabel}
				onPrimary={onStartMaking}
				onRemix={onRemix}
			/>

			{pattern.overview.summary ? (
				<p className="mt-4 max-w-xl text-[13px] leading-relaxed text-muted-foreground">
					{pattern.overview.summary}
				</p>
			) : null}

			<KeyFactsGrid facts={keyFacts} className="mt-4 max-w-xl" />

			<PatternQualityIncluded
				className="mt-6"
				items={included.map((item) => ({ id: item.id, label: item.label }))}
			/>

			<WhatsInsideList
				className="mt-6"
				readOnly
				items={whatsInside}
				linkComponent={({ to, className, children }) => (
					<Link to={to} className={className}>
						{children}
					</Link>
				)}
			/>

			<section id="reviews" className="mt-8 max-w-xl scroll-mt-6">
				<h2 className="text-[11px] uppercase tracking-wide text-muted-foreground">
					Reviews
				</h2>
				<p className="mt-2 text-sm text-muted-foreground">
					{listing.reviewCount != null
						? `${listing.reviewCount.toLocaleString()} reviews — full reviews land with marketplace auth in Phase 7.`
						: 'Reviews will appear here once marketplace auth lands in Phase 7.'}
				</p>
			</section>
		</div>
	);
}

function PatternEditOverview({
	pattern,
	patternId,
}: {
	pattern: NonNullable<ReturnType<typeof usePattern>>;
	patternId: string;
}) {
	const photos = (pattern.overview.gallery ?? []).map((photo, index) => ({
		id: `gallery-${index}`,
		src: photo.src || undefined,
		alt: photo.alt,
	}));
	const keyFacts = patternOverviewKeyFacts(pattern);
	const whatsInside = patternWhatsInsideItems(patternId, pattern);
	const qualityChecks = patternQualityChecks(pattern);

	return (
		<div className="px-6 py-8">
			<PatternOverviewHeader
				title={pattern.overview.name}
				statusLabel={patternOverviewStatusLabel(pattern)}
			/>

			<EditableDescription
				className="mt-2"
				value={pattern.overview.summary ?? ''}
				onChange={(summary) => updatePatternOverview(patternId, { summary })}
			/>

			<ProgressPhotoGallery
				className="mt-4"
				photos={photos}
				addPhotoAction={
					<button
						type="button"
						className="flex size-[7.5rem] shrink-0 items-center justify-center rounded-md border border-dashed border-border bg-transparent text-muted-foreground hover:bg-muted/50"
						aria-label="Add photo"
					>
						<Icon name="add" label="" className="size-6 opacity-60" />
					</button>
				}
			/>

			<KeyFactsGrid facts={keyFacts} className="mt-4 max-w-xl" />

			<PatternQualityChecks checks={qualityChecks} className="mt-6" />

			<WhatsInsideList
				className="mt-6"
				items={whatsInside}
				linkComponent={({ to, className, children }) => (
					<Link to={to} className={className}>
						{children}
					</Link>
				)}
			/>
		</div>
	);
}

export default function PatternOverview() {
	const { patternId } = useParams<{ patternId: string }>();
	const mode = usePatternInteriorMode();
	const ctx = useOutletContext<PatternInteriorOutletContext>();
	const workbenchPattern = usePattern(mode === 'edit' ? patternId : undefined);
	const viewPattern =
		mode === 'view' && patternId ? resolveViewPattern(patternId) : undefined;
	const pattern = mode === 'view' ? viewPattern : workbenchPattern;

	if (!pattern || !patternId) {
		return (
			<div className="px-6 py-8 text-sm text-muted-foreground">
				Loading overview…
			</div>
		);
	}

	if (mode === 'view') {
		return (
			<PatternViewOverview pattern={pattern} patternId={patternId} ctx={ctx} />
		);
	}

	return <PatternEditOverview pattern={pattern} patternId={patternId} />;
}

import {
	EditableDescription,
	KeyFactsGrid,
	PatternOverviewHeader,
	PatternQualityChecks,
	ProgressPhotoGallery,
	WhatsInsideList,
} from '@threadwick/core/components';
import {
	patternOverviewKeyFacts,
	patternOverviewStatusLabel,
	patternQualityChecks,
	patternWhatsInsideItems,
} from '@threadwick/editor';
import { Icon } from '@threadwick/icons';
import { Link, useParams } from 'react-router';
import { updatePatternOverview, usePattern } from '../../../studio/pattern-store';

export default function PatternOverview() {
	const { patternId } = useParams<{ patternId: string }>();
	const pattern = usePattern(patternId);

	if (!pattern || !patternId) {
		return (
			<div className="px-6 py-8 text-sm text-muted-foreground">Loading overview…</div>
		);
	}

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

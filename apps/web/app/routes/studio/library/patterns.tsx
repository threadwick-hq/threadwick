import {
	CardGrid,
	EmptyState,
	PhotoCard,
	type PhotoCardMedia,
} from '@threadwick/core/components';
import {
	acquisitionFromOwnership,
	type Pattern,
	type PatternOwnership,
} from '@threadwick/types';
import { Link } from 'react-router';
import { patternInScope, useCraftScope } from '../../../studio/craft-scope';
import { useSavedPatterns } from '../../../studio/pattern-ownership-store';

const ACQUISITION_LABEL = {
	saved: 'Saved',
	free: 'Free',
	purchased: 'Bought',
} as const;

/** Library › Patterns — your saved + bought patterns (spec §7), with the newer-version nudge. */
export default function LibraryPatterns() {
	const { scope } = useCraftScope();
	const saved = useSavedPatterns().filter((entry) =>
		patternInScope(scope, entry.pattern),
	);

	return (
		<div className="px-6 py-8">
			<h1 className="text-2xl font-medium tracking-tight">Patterns</h1>
			<p className="mt-1 text-sm text-muted-foreground">
				{saved.length} saved or bought — your collection.
			</p>

			{saved.length === 0 ? (
				<EmptyState
					className="mt-6"
					title="Nothing saved yet"
					description="Save or buy a pattern in the marketplace and it will appear here."
				/>
			) : (
				<CardGrid className="mt-6">
					{saved.map(({ pattern, ownership }) => (
						<Link
							key={pattern.id}
							to={`/studio/patterns/${pattern.id}?view=1`}
							aria-label={`Open ${pattern.overview.name}`}
							className="block rounded-xl"
						>
							<PhotoCard
								title={pattern.overview.name}
								subtitle={
									hasNewerVersion(pattern, ownership)
										? 'Newer version available'
										: ACQUISITION_LABEL[acquisitionFromOwnership(ownership)]
								}
								badge={ACQUISITION_LABEL[acquisitionFromOwnership(ownership)]}
								{...patternMedia(pattern)}
							/>
						</Link>
					))}
				</CardGrid>
			)}
		</div>
	);
}

/** The "newer version available" nudge: a later published version than the one you own. */
function hasNewerVersion(
	pattern: Pattern,
	ownership: PatternOwnership,
): boolean {
	const pinned = ownership.lastViewedVersionId;
	if (!pinned || !pattern.versioning) return false;
	const published = pattern.versioning.versions.filter(
		(v) => v.status === 'published',
	);
	const latest = published.at(-1);
	return latest !== undefined && latest.id !== pinned;
}

function patternMedia(pattern: Pattern): PhotoCardMedia {
	const cover = pattern.overview.cover;
	return cover?.src.trim()
		? { photoUrl: cover.src, photoAlt: cover.alt ?? '' }
		: {};
}

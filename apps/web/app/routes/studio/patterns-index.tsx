import {
	CardGrid,
	EmptyState,
	PhotoCard,
	type PhotoCardMedia,
} from '@threadwick/core/components';
import {
	formatRelativeAgo,
	patternDraftVersion,
	patternEditedAt,
	patternPublishedVersion,
} from '@threadwick/editor';
import type { Pattern } from '@threadwick/types';
import { Link } from 'react-router';
import { usePatternLibrary } from '../../studio/pattern-store';

/** Workbench patterns list — your designs, drilling into the pattern interior. */
export default function PatternsIndex() {
	const patterns = usePatternLibrary();

	return (
		<div className="px-6 py-8">
			<h1 className="text-2xl font-medium tracking-tight">Patterns</h1>
			<p className="mt-1 text-sm text-muted-foreground">
				{patterns.length} pattern{patterns.length === 1 ? '' : 's'} — your
				authored designs.
			</p>

			{patterns.length === 0 ? (
				<EmptyState
					className="mt-6"
					title="No patterns yet"
					description="Design your first pattern and it will appear here."
				/>
			) : (
				<CardGrid className="mt-6">
					{patterns.map((pattern) => {
						const cover = pattern.overview.cover;
						const media: PhotoCardMedia = cover
							? { photoUrl: cover.src, photoAlt: cover.alt ?? '' }
							: {};
						return (
							<Link
								key={pattern.id}
								to={`/studio/patterns/${pattern.id}`}
								aria-label={`Open ${pattern.overview.name}`}
								className="block rounded-xl"
							>
								<PhotoCard
									title={pattern.overview.name}
									subtitle={patternStateLine(pattern)}
									badge={patternBadge(pattern)}
									{...media}
								/>
							</Link>
						);
					})}
				</CardGrid>
			)}

			<section className="mt-10">
				<h2 className="text-sm font-medium">Marketplace demos</h2>
				<p className="mt-1 text-sm text-muted-foreground">
					Open view mode for the wildflower granny square — free or paid demo.
				</p>
				<ul className="mt-3 space-y-2">
					<li>
						<Link
							to="/studio/patterns/pat-wildflower-granny?view=1"
							className="block rounded-md border border-border px-4 py-3 text-sm font-medium hover:bg-muted/50"
						>
							Wildflower granny square — free
						</Link>
					</li>
					<li>
						<Link
							to="/studio/patterns/pat-wildflower-granny?view=1&paid=1"
							className="block rounded-md border border-border px-4 py-3 text-sm font-medium hover:bg-muted/50"
						>
							Wildflower granny square — $5.99 demo
						</Link>
					</li>
				</ul>
			</section>
		</div>
	);
}

function patternStateLine(pattern: Pattern): string | undefined {
	const editedAt = patternEditedAt(pattern);
	return editedAt
		? `Edited ${lowercaseJustNow(formatRelativeAgo(editedAt))}`
		: undefined;
}

function patternBadge(pattern: Pattern): string | undefined {
	if (patternDraftVersion(pattern)) return 'Draft';
	if (patternPublishedVersion(pattern)) return 'Published';
	return undefined;
}

function lowercaseJustNow(ago: string): string {
	return ago === 'Just now' ? 'just now' : ago;
}

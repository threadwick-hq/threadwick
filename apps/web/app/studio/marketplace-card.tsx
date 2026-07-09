import { Button, PhotoCard, type PhotoCardMedia } from '@threadwick/core/ui';
import { formatPatternPrice } from '@threadwick/editor/follow';
import { Icon } from '@threadwick/icons';
import type { CatalogueListing } from '@threadwick/types';
import { Link } from 'react-router';
import {
	isPatternBookmarked,
	setPatternBookmarked,
	usePatternMarketplaceState,
} from './pattern-ownership-store';

/**
 * MarketplaceCard — a catalogue listing tile: cover photo (or the standard
 * gray placeholder), price badge, designer footer, and a wishlist toggle.
 * Links into the pattern's interior view mode (mirrors the workbench
 * PatternsIndex `?view=1` deep-link).
 */
export function MarketplaceCard({ listing }: { listing: CatalogueListing }) {
	usePatternMarketplaceState();
	const bookmarked = isPatternBookmarked(listing.patternId);
	const priceLabel = formatPatternPrice(listing);
	// A cover's own alt can be empty (decorative crop); fall back to the
	// listing title so the image never loses its accessible name. No cover at
	// all falls through to PhotoCard's built-in placeholder fill.
	const media: PhotoCardMedia = listing.cover?.src.trim()
		? {
				photoUrl: listing.cover.src,
				photoAlt: listing.cover.alt || listing.title,
			}
		: {};

	return (
		<div className="relative">
			<Link
				to={`/studio/patterns/${listing.patternId}?view=1`}
				aria-label={`Open ${listing.title}`}
				className="block rounded-xl"
			>
				<PhotoCard
					title={listing.title}
					badge={priceLabel}
					footer={
						listing.designer ? (
							<div className="truncate text-xs text-muted-foreground">
								{listing.designer}
							</div>
						) : undefined
					}
					{...media}
				/>
			</Link>
			<Button
				type="button"
				variant="ghost"
				size="icon"
				className="absolute right-2 top-2 size-8 rounded-full bg-card/90 text-muted-foreground shadow-sm hover:bg-card"
				aria-label={
					bookmarked
						? `Remove ${listing.title} from wishlist`
						: `Add ${listing.title} to wishlist`
				}
				aria-pressed={bookmarked}
				onClick={() => setPatternBookmarked(listing.patternId, !bookmarked)}
			>
				<Icon name="wishlist" label="" className="size-4" />
			</Button>
		</div>
	);
}

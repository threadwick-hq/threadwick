import { isMarketplaceEnabled } from '@threadwick/core/capabilities';
import { Button, Card, CardGrid, Input } from '@threadwick/core/components';
import { Icon } from '@threadwick/icons';
import type { CatalogueListing } from '@threadwick/types';
import { type FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import {
	followingListings,
	freeListings,
	newListings,
	popularListings,
	useCatalogueListings,
} from '../../../studio/catalogue-adapter';
import { craftIncludes, useCraftScope } from '../../../studio/craft-scope';
import {
	toggleFollowingDesigner,
	useFollowedDesigners,
} from '../../../studio/following-store';
import { MarketplaceCard } from '../../../studio/marketplace-card';
import { serializeMarketplaceFilters } from '../../../studio/marketplace-filters';

const ROW_LIMIT = 4;

/**
 * Marketplace › Home (spec #93 §8): a curated landing page, deliberately
 * without a filter bar — search hands off to Browse, and each curated row
 * links into a pre-filtered Browse for the full set.
 */
export default function MarketplaceHome() {
	// Hooks run unconditionally on every render (rules-of-hooks); the flag gate
	// below only decides what gets returned, never whether these are called.
	const navigate = useNavigate();
	const [searchValue, setSearchValue] = useState('');
	const { scope } = useCraftScope();
	const followedHandles = useFollowedDesigners();
	const allListings = useCatalogueListings();
	const [spotlightHandle, setSpotlightHandle] = useState<string | undefined>(
		undefined,
	);

	if (!isMarketplaceEnabled()) return <Navigate to="/studio" replace />;

	// Craft-scoped, same as Browse, so a curated card never "See all"s into an
	// empty scoped result.
	const listings = allListings.filter((listing) =>
		craftIncludes(scope, [listing.facets.craft]),
	);

	const popular = popularListings(listings, ROW_LIMIT);
	const free = freeListings(listings, ROW_LIMIT);
	const fresh = newListings(listings, ROW_LIMIT);
	const following = followingListings(listings, followedHandles, ROW_LIMIT);

	// Pin the spotlight designer once a candidate exists, rather than
	// recomputing it fresh every render: `followedHandles` changing (a Follow
	// click) would otherwise pick the NEXT unfollowed designer and swap the
	// spotlight out from under the user right as they click. The `undefined`
	// guard also means this tolerates the catalogue's async local-store seed
	// (listings can be empty on the very first render) — it locks in as soon
	// as a real candidate shows up, and never again after that.
	if (spotlightHandle === undefined) {
		const candidate = pickSpotlightDesigner(listings, followedHandles);
		if (candidate !== undefined) setSpotlightHandle(candidate);
	}

	function handleSearchSubmit(event: FormEvent<HTMLFormElement>): void {
		event.preventDefault();
		const params = serializeMarketplaceFilters({
			search: searchValue.trim() || undefined,
		});
		const query = params.toString();
		navigate(`/studio/marketplace/browse${query ? `?${query}` : ''}`);
	}

	return (
		<div className="px-6 py-8">
			<h1 className="text-2xl font-medium tracking-tight">Marketplace</h1>
			<p className="mt-1 text-sm text-muted-foreground">
				Discover patterns from designers around the world.
			</p>

			<search className="mt-6 block max-w-xl">
				<form onSubmit={handleSearchSubmit} className="flex gap-2">
					<Input
						type="search"
						value={searchValue}
						onChange={(event) => setSearchValue(event.target.value)}
						placeholder="Search patterns, designers…"
						aria-label="Search the marketplace"
					/>
					<Button type="submit" size="icon" aria-label="Search">
						<Icon name="search" label="" />
					</Button>
				</form>
			</search>

			<CuratedRow
				title="Popular"
				listings={popular}
				seeAllHref="/studio/marketplace/browse"
			/>
			<CuratedRow
				title="Free"
				listings={free}
				seeAllHref="/studio/marketplace/free"
			/>
			<CuratedRow
				title="New"
				listings={fresh}
				seeAllHref="/studio/marketplace/browse?sort=new"
			/>
			<CuratedRow
				title="From designers you follow"
				listings={following}
				seeAllHref="/studio/marketplace/following"
			/>

			{spotlightHandle !== undefined ? (
				<DesignerSpotlight
					handle={spotlightHandle}
					listingCount={
						listings.filter((listing) => listing.designer === spotlightHandle)
							.length
					}
					isFollowing={followedHandles.includes(spotlightHandle)}
				/>
			) : null}
		</div>
	);
}

/** One titled curated row of listings, hidden entirely when it has nothing to show. */
function CuratedRow({
	title,
	listings,
	seeAllHref,
}: {
	title: string;
	listings: readonly CatalogueListing[];
	seeAllHref: string;
}) {
	if (listings.length === 0) return null;
	return (
		<section className="mt-10">
			<div className="flex items-center justify-between">
				<h2 className="text-sm font-medium">{title}</h2>
				<Link
					to={seeAllHref}
					className="text-xs font-medium text-primary hover:underline"
				>
					See all
				</Link>
			</div>
			<CardGrid className="mt-3">
				{listings.map((listing) => (
					<MarketplaceCard key={listing.patternId} listing={listing} />
				))}
			</CardGrid>
		</section>
	);
}

/** The one-designer spotlight card with a Follow CTA. */
function DesignerSpotlight({
	handle,
	listingCount,
	isFollowing,
}: {
	handle: string;
	listingCount: number;
	isFollowing: boolean;
}) {
	return (
		<section className="mt-10" aria-labelledby="spotlight-heading">
			<h2 id="spotlight-heading" className="text-sm font-medium">
				Designer spotlight
			</h2>
			<Card className="mt-3 flex flex-wrap items-center justify-between gap-4 p-5">
				<div>
					<div className="text-lg font-medium">{handle}</div>
					<p className="mt-1 text-sm text-muted-foreground">
						{listingCount} pattern{listingCount === 1 ? '' : 's'} in the
						catalogue.
					</p>
				</div>
				<Button
					type="button"
					variant={isFollowing ? 'outline' : 'default'}
					aria-pressed={isFollowing}
					onClick={() => toggleFollowingDesigner(handle)}
				>
					{isFollowing ? 'Following' : 'Follow'}
				</Button>
			</Card>
		</section>
	);
}

/**
 * Picks the spotlight designer: the first (by catalogue order) whose handle
 * isn't already followed, so the Follow CTA is always actionable — falling
 * back to the first designer present when every designer is already followed.
 */
function pickSpotlightDesigner(
	listings: readonly CatalogueListing[],
	followedHandles: readonly string[],
): string | undefined {
	const handles: string[] = [];
	for (const listing of listings) {
		if (listing.designer !== undefined && !handles.includes(listing.designer)) {
			handles.push(listing.designer);
		}
	}
	if (handles.length === 0) return undefined;
	return (
		handles.find((handle) => !followedHandles.includes(handle)) ?? handles[0]
	);
}

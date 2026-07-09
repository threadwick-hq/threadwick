import {
	Badge,
	Button,
	CardGrid,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	EmptyState,
	Segmented,
	SegmentedItem,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@threadwick/core/ui';
import { Icon } from '@threadwick/icons';
import type { YarnWeight } from '@threadwick/types';
import { useNavigate, useSearchParams } from 'react-router';
import type { CatalogueSort } from './catalogue-adapter';
import {
	catalogueFacetOptions,
	queryCatalogue,
	useCatalogueListings,
} from './catalogue-adapter';
import { craftIncludes, useCraftScope } from './craft-scope';
import { useFollowedDesigners } from './following-store';
import { MarketplaceCard } from './marketplace-card';
import type {
	MarketplaceFilters,
	MarketplaceQueryExtra,
} from './marketplace-filters';
import {
	parseMarketplaceFilters,
	serializeMarketplaceFilters,
	toQueryOptions,
} from './marketplace-filters';
import {
	isPatternBookmarked,
	usePatternMarketplaceState,
} from './pattern-ownership-store';

/** The locked-facet Browse presets, each backing one Marketplace route (spec #93). */
export type MarketplacePreset = 'following' | 'free' | 'wishlist';

const PRESET_CHIP_LABEL: Record<MarketplacePreset, string> = {
	following: 'Following',
	free: 'Free',
	wishlist: 'Wishlist',
};

const PRESET_TITLE: Record<MarketplacePreset, string> = {
	following: 'From designers you follow',
	free: 'Free patterns',
	wishlist: 'Your wishlist',
};

/** Weight-specific labels — `humanize` alone would render "dk" as "Dk" instead of "DK". */
const WEIGHT_LABELS: Record<YarnWeight, string> = {
	lace: 'Lace',
	fingering: 'Fingering',
	sport: 'Sport',
	dk: 'DK',
	worsted: 'Worsted',
	aran: 'Aran',
	bulky: 'Bulky',
	'super-bulky': 'Super bulky',
	jumbo: 'Jumbo',
};

const SORT_OPTIONS: readonly { value: CatalogueSort; label: string }[] = [
	{ value: 'popular', label: 'Popular' },
	{ value: 'new', label: 'Newest' },
	{ value: 'price-low', label: 'Price: low to high' },
	{ value: 'price-high', label: 'Price: high to low' },
];
const SORT_VALUES = SORT_OPTIONS.map((option) => option.value);

/** One removable pin in the applied-filters row. */
type AppliedFilterChip = {
	key: string;
	label: string;
	onRemove: () => void;
};

/**
 * MarketplaceBrowse — the reusable filterable catalogue grid. Filter state
 * lives entirely in the URL (see `marketplace-filters.ts`); `preset` locks in
 * an additional, non-URL query constraint for the Following/Free/Wishlist
 * routes while leaving the rest of the facet row live.
 */
export function MarketplaceBrowse({ preset }: { preset?: MarketplacePreset }) {
	usePatternMarketplaceState();
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();
	const filters = parseMarketplaceFilters(searchParams);

	const { scope } = useCraftScope();
	const allListings = useCatalogueListings();
	// Craft scope narrows the catalogue BEFORE facet options or the query run,
	// so both the filter controls and the results only ever reflect the
	// viewer's active craft (spec #93 + craft-scope.ts's inclusion contract).
	const scopedListings = allListings.filter((listing) =>
		craftIncludes(scope, [listing.facets.craft]),
	);
	const facetOptions = catalogueFacetOptions(scopedListings);

	const followedHandles = useFollowedDesigners();
	const bookmarkedIds = scopedListings
		.filter((listing) => isPatternBookmarked(listing.patternId))
		.map((listing) => listing.patternId);

	const { effectiveFilters, presetExtra } = resolvePresetQuery(
		preset,
		filters,
		followedHandles,
		bookmarkedIds,
	);
	const results = queryCatalogue(
		scopedListings,
		toQueryOptions(effectiveFilters, presetExtra),
	);

	function updateFilters(patch: Partial<MarketplaceFilters>): void {
		setSearchParams(serializeMarketplaceFilters({ ...filters, ...patch }), {
			replace: true,
		});
	}

	function clearAll(): void {
		// Resets every URL-derived filter; `preset` is untouched because it comes
		// from the route, not the URL, so a preset view stays on its preset.
		setSearchParams(new URLSearchParams(), { replace: true });
	}

	function removePreset(): void {
		// Drops the preset by navigating to the unfiltered Browse route,
		// carrying over whatever URL filters are currently applied.
		navigate({
			pathname: '/studio/marketplace/browse',
			search: searchParams.toString(),
		});
	}

	const chips = buildAppliedFilterChips({
		preset,
		filters,
		onRemovePreset: removePreset,
		onUpdateFilters: updateFilters,
	});
	const hasClearableFilters = chips.some((chip) => chip.key !== 'preset');
	const emptyState = resolveEmptyStateCopy(preset, hasClearableFilters);

	return (
		<div className="px-6 py-8">
			<h1 className="text-2xl font-medium tracking-tight">
				{preset !== undefined ? PRESET_TITLE[preset] : 'Browse the marketplace'}
			</h1>
			<p className="mt-1 text-sm text-muted-foreground">
				{results.length} pattern{results.length === 1 ? '' : 's'}.
			</p>

			<div className="mt-4 flex flex-wrap items-center gap-2">
				<Segmented
					value={filters.category ?? 'all'}
					onValueChange={(value) =>
						updateFilters({
							category: findMatch(facetOptions.categories, value),
						})
					}
					aria-label="Category"
				>
					<SegmentedItem value="all">All</SegmentedItem>
					{facetOptions.categories.map((category) => (
						<SegmentedItem key={category} value={category}>
							{humanize(category)}
						</SegmentedItem>
					))}
				</Segmented>

				<Select
					value={filters.weight ?? 'all'}
					onValueChange={(value) =>
						updateFilters({ weight: findMatch(facetOptions.weights, value) })
					}
				>
					<SelectTrigger aria-label="Weight" className="h-9 w-36 shrink-0">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All weights</SelectItem>
						{facetOptions.weights.map((weight) => (
							<SelectItem key={weight} value={weight}>
								{WEIGHT_LABELS[weight]}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<Select
					value={filters.difficulty ?? 'all'}
					onValueChange={(value) =>
						updateFilters({
							difficulty: findMatch(facetOptions.difficulties, value),
						})
					}
				>
					<SelectTrigger aria-label="Difficulty" className="h-9 w-40 shrink-0">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All difficulties</SelectItem>
						{facetOptions.difficulties.map((difficulty) => (
							<SelectItem key={difficulty} value={difficulty}>
								{humanize(difficulty)}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				{preset !== 'free' ? (
					<Button
						type="button"
						variant={filters.free === true ? 'default' : 'outline'}
						size="sm"
						aria-pressed={filters.free === true}
						onClick={() =>
							updateFilters({ free: filters.free === true ? undefined : true })
						}
					>
						<Icon name="gift" label="" />
						Free
					</Button>
				) : null}

				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button type="button" variant="outline" size="sm">
							<Icon name="filter" label="" />
							More filters
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="start">
						<DropdownMenuLabel>More filters</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<p className="max-w-56 px-2 py-1.5 text-xs text-muted-foreground">
							The full attribute set (hook/needle size, yardage, techniques)
							lands with the marketplace integration — Category, Weight, and
							Difficulty above cover the common cases for now.
						</p>
					</DropdownMenuContent>
				</DropdownMenu>

				<div className="ml-auto">
					<Select
						value={filters.sort ?? 'popular'}
						onValueChange={(value) => {
							const sort = findMatch(SORT_VALUES, value);
							updateFilters({ sort: sort === 'popular' ? undefined : sort });
						}}
					>
						<SelectTrigger aria-label="Sort" className="h-9 w-44">
							<Icon name="sort" label="" className="text-muted-foreground" />
							<SelectValue />
						</SelectTrigger>
						<SelectContent align="end">
							{SORT_OPTIONS.map((option) => (
								<SelectItem key={option.value} value={option.value}>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			{chips.length > 0 ? (
				<div className="mt-3 flex flex-wrap items-center gap-1.5">
					{chips.map((chip) => (
						<Badge
							key={chip.key}
							variant="secondary"
							className="gap-1 py-1 pl-2.5 pr-1.5"
						>
							{chip.label}
							<button
								type="button"
								onClick={chip.onRemove}
								aria-label={`Remove ${chip.label} filter`}
								className="flex size-4 items-center justify-center rounded-full hover:bg-foreground/10"
							>
								<Icon name="close" label="" className="size-3" />
							</button>
						</Badge>
					))}
					{hasClearableFilters ? (
						<button
							type="button"
							onClick={clearAll}
							className="text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
						>
							Clear all
						</button>
					) : null}
				</div>
			) : null}

			{results.length === 0 ? (
				<EmptyState
					className="mt-6"
					title={emptyState.title}
					description={emptyState.description}
					action={
						hasClearableFilters ? (
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={clearAll}
							>
								Clear all
							</Button>
						) : undefined
					}
				/>
			) : (
				<CardGrid className="mt-6">
					{results.map((listing) => (
						<MarketplaceCard key={listing.patternId} listing={listing} />
					))}
				</CardGrid>
			)}
		</div>
	);
}

/** Turns a kebab-case facet value into a readable label, e.g. "home-bags" → "Home bags". */
function humanize(value: string): string {
	const spaced = value.replace(/-/g, ' ');
	return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/** Narrows a raw control value to a member of `options`, or undefined when it matches none. */
function findMatch<T extends string>(
	options: readonly T[],
	value: string,
): T | undefined {
	return options.find((option) => option === value);
}

/**
 * Resolves the preset-locked query additions on top of the URL-derived
 * filters: `free` is expressible as a regular facet, so it's folded directly
 * into the filters; `following`/`wishlist` have no URL-filter equivalent, so
 * they ride in as extra query options instead.
 */
function resolvePresetQuery(
	preset: MarketplacePreset | undefined,
	filters: MarketplaceFilters,
	followedHandles: readonly string[],
	bookmarkedIds: readonly string[],
): {
	effectiveFilters: MarketplaceFilters;
	presetExtra: MarketplaceQueryExtra;
} {
	if (preset === 'free') {
		return { effectiveFilters: { ...filters, free: true }, presetExtra: {} };
	}
	if (preset === 'following') {
		return {
			effectiveFilters: filters,
			presetExtra: { onlyFollowing: true, followedHandles },
		};
	}
	if (preset === 'wishlist') {
		return {
			effectiveFilters: filters,
			presetExtra: { onlyWishlist: true, bookmarkedIds },
		};
	}
	return { effectiveFilters: filters, presetExtra: {} };
}

/** Builds the removable applied-filter pins: the preset (if any), then each active facet/search. */
function buildAppliedFilterChips(params: {
	preset: MarketplacePreset | undefined;
	filters: MarketplaceFilters;
	onRemovePreset: () => void;
	onUpdateFilters: (patch: Partial<MarketplaceFilters>) => void;
}): AppliedFilterChip[] {
	const { preset, filters, onRemovePreset, onUpdateFilters } = params;
	const chips: AppliedFilterChip[] = [];
	if (preset !== undefined) {
		chips.push({
			key: 'preset',
			label: PRESET_CHIP_LABEL[preset],
			onRemove: onRemovePreset,
		});
	}
	if (filters.search !== undefined) {
		chips.push({
			key: 'search',
			label: `"${filters.search}"`,
			onRemove: () => onUpdateFilters({ search: undefined }),
		});
	}
	if (filters.category !== undefined) {
		chips.push({
			key: 'category',
			label: humanize(filters.category),
			onRemove: () => onUpdateFilters({ category: undefined }),
		});
	}
	if (filters.weight !== undefined) {
		chips.push({
			key: 'weight',
			label: WEIGHT_LABELS[filters.weight],
			onRemove: () => onUpdateFilters({ weight: undefined }),
		});
	}
	if (filters.difficulty !== undefined) {
		chips.push({
			key: 'difficulty',
			label: humanize(filters.difficulty),
			onRemove: () => onUpdateFilters({ difficulty: undefined }),
		});
	}
	// The `free` preset already pins its own "Free" chip above; skip the facet
	// chip too, or the row shows "Free" twice for the same constraint.
	if (filters.free === true && preset !== 'free') {
		chips.push({
			key: 'free',
			label: 'Free',
			onRemove: () => onUpdateFilters({ free: undefined }),
		});
	}
	return chips;
}

/**
 * Resolves the "no results" copy. When a facet/search filter is still
 * clearable, the generic widen-or-clear guidance applies regardless of
 * preset. Otherwise (an empty preset view with nothing left to clear),
 * `wishlist` and `following` get preset-specific, actionable copy; `free`
 * falls back to the same generic copy since there's no comparable action.
 */
function resolveEmptyStateCopy(
	preset: MarketplacePreset | undefined,
	hasClearableFilters: boolean,
): { title: string; description: string } {
	const genericEmptyState = {
		title: 'No patterns match',
		description:
			'Try widening your filters or clearing them to see the full catalogue.',
	};
	if (hasClearableFilters) return genericEmptyState;
	if (preset === 'wishlist') {
		return {
			title: 'Your wishlist is empty',
			description: 'Tap the heart on any pattern to save it here.',
		};
	}
	if (preset === 'following') {
		return {
			title: 'No listings from designers you follow',
			description: 'Follow a designer to see their patterns here.',
		};
	}
	return genericEmptyState;
}

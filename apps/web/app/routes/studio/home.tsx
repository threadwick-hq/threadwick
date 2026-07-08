import { isMarketplaceEnabled } from '@threadwick/core/capabilities';
import {
	CardGrid,
	EmptyState,
	PhotoCard,
	type PhotoCardMedia,
} from '@threadwick/core/components';
import type { RecentItem } from '@threadwick/editor';
import { Icon, type IconName } from '@threadwick/icons';
import type { ImageRef } from '@threadwick/types';
import { Link } from 'react-router';
import { getPattern } from '../../studio/pattern-store';
import { useRecents } from '../../studio/recents';
import { useStudioStore } from '../../studio/studio-store';

type QuickStartChip = {
	to: string;
	icon: IconName;
	label: string;
};

// Both roles' entries, never gated (spec §3). Creation flows are their own
// later tasks; the chips navigate to the owning surfaces.
const QUICK_START: QuickStartChip[] = [
	{ to: '/studio/patterns', icon: 'add', label: 'New pattern' },
	{ to: '/studio/projects', icon: 'make-it', label: 'New project' },
	{ to: '/studio/projects', icon: 'download', label: 'Import' },
	{
		to: '/studio/marketplace/browse',
		icon: 'browse',
		label: 'Browse marketplace',
	},
];

/** Home — single-column, personal-first (spec §3): greeting, quick start, Continue. */
export default function StudioHome() {
	const recents = useRecents();
	const store = useStudioStore();
	// Drop the marketplace entry chip when the networked layer is off.
	const chips = QUICK_START.filter(
		(chip) =>
			isMarketplaceEnabled() || !chip.to.startsWith('/studio/marketplace'),
	);

	// The read model deliberately carries no media; resolve per kind here.
	const mediaFor = (item: RecentItem): PhotoCardMedia => {
		const image = recentImage(item);
		return image?.src.trim()
			? { photoUrl: image.src, photoAlt: image.alt ?? '' }
			: {};
	};

	function recentImage(item: RecentItem): ImageRef | undefined {
		switch (item.kind) {
			case 'pattern':
				return getPattern(item.id)?.overview.cover;
			case 'project':
				return store?.state.library.projects.find((p) => p.id === item.id)
					?.photos?.[0]?.image;
			default:
				return assertNever(item.kind);
		}
	}

	return (
		<div className="mx-auto max-w-3xl px-6 py-8">
			<h1 className="text-2xl font-medium tracking-tight">{greeting()}</h1>
			<p className="mt-1 text-sm text-muted-foreground">
				Your work and the marketplace, all in one place.
			</p>

			<nav aria-label="Quick start" className="mt-6 flex flex-wrap gap-2">
				{chips.map((chip) => (
					<Link
						key={chip.label}
						to={chip.to}
						className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted/50 [&_svg]:size-3.5"
					>
						<Icon name={chip.icon} label="" />
						{chip.label}
					</Link>
				))}
			</nav>

			<section className="mt-10" aria-labelledby="continue-heading">
				<h2 id="continue-heading" className="text-sm font-medium">
					Continue
				</h2>
				{recents === null ? (
					<p className="mt-3 text-sm text-muted-foreground">
						Loading your recent work…
					</p>
				) : recents.lead === undefined ? (
					<EmptyState
						className="mt-3"
						title="Nothing in progress yet"
						description="Start something with the quick-start chips above and it will be waiting for you here."
					/>
				) : (
					<>
						<LeadCard item={recents.lead} media={mediaFor(recents.lead)} />
						{recents.shelf.length > 0 ? (
							<CardGrid className="mt-4">
								{recents.shelf.map((item) => (
									<Link
										key={`${item.kind}-${item.id}`}
										to={recentHref(item)}
										aria-label={`Open ${item.title}`}
										className="block rounded-xl"
									>
										<PhotoCard
											title={item.title}
											subtitle={item.state}
											{...mediaFor(item)}
										/>
									</Link>
								))}
							</CardGrid>
						) : null}
					</>
				)}
			</section>

			<p className="mt-12 text-center text-xs text-muted-foreground">
				Saved in your browser — local-first, yours to export any time.
			</p>
		</div>
	);
}

/** The content-width "pick up where you left off" lead card. */
function LeadCard({
	item,
	media,
}: {
	item: RecentItem;
	media: PhotoCardMedia;
}) {
	return (
		<Link
			to={recentHref(item)}
			aria-label={`Continue ${item.title}`}
			className="mt-3 flex overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md"
		>
			<div className="relative aspect-[4/3] w-40 shrink-0 sm:w-56">
				{media.photoUrl !== undefined ? (
					<img
						src={media.photoUrl}
						alt={media.photoAlt}
						loading="lazy"
						className="absolute inset-0 h-full w-full object-cover"
					/>
				) : (
					<div aria-hidden="true" className="absolute inset-0 bg-muted" />
				)}
			</div>
			<div className="flex min-w-0 flex-col justify-center gap-1 p-5">
				<div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
					Pick up where you left off
				</div>
				<div className="truncate text-lg font-medium">{item.title}</div>
				<div className="text-sm text-muted-foreground">{item.state}</div>
			</div>
		</Link>
	);
}

function greeting(): string {
	const hour = new Date().getHours();
	if (hour < 5) return 'Working late';
	if (hour < 12) return 'Good morning';
	if (hour < 18) return 'Good afternoon';
	return 'Good evening';
}

function recentHref(item: RecentItem): string {
	switch (item.kind) {
		case 'pattern':
			return `/studio/patterns/${item.id}`;
		case 'project':
			return `/studio/projects/${item.id}`;
		default:
			return assertNever(item.kind);
	}
}

// A new RecentKind (e.g. 'saved', TW-044) must fail to compile here rather
// than silently mislink or drop media.
function assertNever(kind: never): never {
	throw new Error(`Unhandled recent kind: ${String(kind)}`);
}

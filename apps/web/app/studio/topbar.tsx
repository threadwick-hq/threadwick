import { Wordmark } from '@threadwick/core/brand';
import {
	Badge,
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Segmented,
	SegmentedItem,
} from '@threadwick/core/components';
import { cn } from '@threadwick/core/lib/utils';
import { Icon } from '@threadwick/icons';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { CommandPalette } from './command-palette';
import { matchesCommandPaletteChord } from './command-palette-chord';
import { isPublishedCreator } from './creator-status';
import {
	filterNotifications,
	markAllNotificationsRead,
	type NotificationCategory,
	notificationStore,
	unreadCount,
} from './notification-store';
import { usePatternLibrary } from './pattern-store';

type NotificationFilter = 'all' | NotificationCategory;

/**
 * Topbar — the global chrome above every non-immersive Studio screen (TW-022): the
 * Cmd+K search entry, the Import/New menu, and the notification inbox. Search result
 * population, real notification sources, and per-item "newer version" signals are out
 * of scope here — this is the shell they land in.
 */
export function Topbar() {
	const [paletteOpen, setPaletteOpen] = useState(false);
	const [filter, setFilter] = useState<NotificationFilter>('all');
	const isCreator = useIsPublishedCreator();
	const notifications = notificationStore.use();
	// A creator losing published status (or the filter having been set to 'shop'
	// before that happened) must never strand the inbox on a filter it can't show.
	const effectiveFilter: NotificationFilter =
		filter === 'shop' && !isCreator ? 'all' : filter;
	const unread = unreadCount(notifications);
	const filtered = filterNotifications(notifications, effectiveFilter);

	useEffect(() => {
		function handleKeyDown(event: KeyboardEvent) {
			if (event.repeat) return;
			if (!matchesCommandPaletteChord(event)) return;
			event.preventDefault();
			setPaletteOpen((open) => !open);
		}
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, []);

	return (
		<header className="flex h-16 shrink-0 items-center gap-3 border-b border-border px-4">
			<div className="shrink-0 min-[860px]:hidden">
				<Wordmark size={24} />
			</div>

			<button
				type="button"
				aria-label="Search"
				onClick={() => setPaletteOpen(true)}
				className="flex min-w-0 max-w-md flex-1 items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
			>
				<Icon name="search" label="" className="size-4 shrink-0" />
				<span className="min-w-0 flex-1 truncate text-left">Search…</span>
				<kbd className="hidden shrink-0 items-center rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline-flex">
					⌘K
				</kbd>
			</button>

			<CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />

			<div className="ml-auto flex shrink-0 items-center gap-2">
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="outline"
							size="sm"
							aria-label="New"
							className="gap-1.5"
						>
							<Icon name="add" label="" />
							<span className="hidden sm:inline">New</span>
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem asChild>
							<Link to="/studio/patterns" className="flex items-center gap-2">
								<Icon name="add" label="" />
								New pattern
							</Link>
						</DropdownMenuItem>
						<DropdownMenuItem asChild>
							<Link to="/studio/projects" className="flex items-center gap-2">
								<Icon name="make-it" label="" />
								New project
							</Link>
						</DropdownMenuItem>
						<DropdownMenuItem asChild>
							<Link to="/studio/projects" className="flex items-center gap-2">
								<Icon name="download" label="" />
								Import
							</Link>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>

				<Popover>
					<div className="relative shrink-0">
						<PopoverTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								aria-label={
									unread > 0
										? `Notifications, ${unread} unread`
										: 'Notifications'
								}
							>
								<Icon name="bell" label="" />
							</Button>
						</PopoverTrigger>
						{unread > 0 && (
							<Badge className="pointer-events-none absolute -right-1 -top-1 h-4 min-w-4 justify-center rounded-full px-1 text-[10px] leading-none">
								{unread > 9 ? '9+' : unread}
							</Badge>
						)}
					</div>
					<PopoverContent align="end" className="w-80">
						<div className="flex items-center justify-between gap-2">
							<h2 className="text-sm font-semibold">Notifications</h2>
							<Button
								type="button"
								variant="link"
								className="h-auto p-0 text-xs font-medium"
								onClick={() => markAllNotificationsRead()}
							>
								Mark all read
							</Button>
						</div>
						<Segmented
							value={effectiveFilter}
							onValueChange={(value) => {
								if (isNotificationFilter(value)) setFilter(value);
							}}
							aria-label="Filter notifications"
							className="mt-3"
						>
							<SegmentedItem value="all">All</SegmentedItem>
							<SegmentedItem value="activity">Activity</SegmentedItem>
							{isCreator && <SegmentedItem value="shop">Shop</SegmentedItem>}
						</Segmented>
						{filtered.length === 0 ? (
							<p className="py-6 text-center text-sm text-muted-foreground">
								You're all caught up.
							</p>
						) : (
							<ul className="mt-3 flex flex-col gap-1">
								{filtered.map((item) => (
									<li key={item.id} className="flex items-start gap-2 py-1.5">
										<span
											aria-hidden="true"
											className={cn(
												'mt-1.5 size-1.5 shrink-0 rounded-full',
												item.read ? 'bg-transparent' : 'bg-primary',
											)}
										/>
										<div className="min-w-0 flex-1">
											<p className="text-sm font-medium leading-snug text-foreground">
												{item.title}
											</p>
											{item.body !== undefined && (
												<p className="mt-0.5 text-xs text-muted-foreground">
													{item.body}
												</p>
											)}
										</div>
									</li>
								))}
							</ul>
						)}
					</PopoverContent>
				</Popover>
			</div>
		</header>
	);
}

/** Whether the maker has published at least one pattern (switches the inbox to creator view). */
function useIsPublishedCreator(): boolean {
	return isPublishedCreator(usePatternLibrary());
}

/** Narrows a `Segmented` value back to a notification filter at the callback boundary. */
function isNotificationFilter(value: string): value is NotificationFilter {
	return value === 'all' || value === 'activity' || value === 'shop';
}

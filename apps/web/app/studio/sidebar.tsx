import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	InteriorSlot,
} from '@threadwick/core/components';
import { cn } from '@threadwick/core/lib/utils';
import { Icon, type IconName } from '@threadwick/icons';
import type { ReactNode } from 'react';
import { NavLink } from 'react-router';
import {
	addCraft,
	CRAFT_TAXONOMY,
	craftLabel,
	ownedCrafts,
	patternInScope,
	projectInScope,
	setCraftScope,
	useCraftScope,
} from './craft-scope';
import { usePatternLibrary } from './pattern-store';
import { useStudioStore } from './studio-store';

type NavItem = {
	to: string;
	icon: IconName;
	label: string;
	/** Exact-match active state (for the section roots that also have children below them). */
	end?: boolean;
	/** A count badge; rendered even at 0 for "your own stuff" items (honest, not fake). */
	count?: number;
};

type NavSection = {
	label?: string;
	items: NavItem[];
};

/**
 * The always-expanded Studio sidebar nav: every section's items are always visible, ordered to
 * encode the day (create → stash → discover → business). Counts on your own stuff (Workbench,
 * Library) and on Following/Wishlist; the active destination uses the reserved accent. The craft
 * picker slot (TW-023), Creator Insights, and the mobile tab bar (TW-024) land separately.
 */
export function Sidebar() {
	const store = useStudioStore();
	const { scope } = useCraftScope();
	// Workbench counts read the same scoped collections the list routes
	// render, so the badge and the list can never disagree.
	const projects = (store?.state.library.projects ?? []).filter((project) =>
		projectInScope(scope, project),
	);
	const patternCount = usePatternLibrary().filter((pattern) =>
		patternInScope(scope, pattern),
	).length;

	const sections: NavSection[] = [
		{ items: [{ to: '/studio', icon: 'home', label: 'Home', end: true }] },
		{
			label: 'Workbench',
			items: [
				{
					to: '/studio/patterns',
					icon: 'patterns',
					label: 'Patterns',
					count: patternCount,
				},
				{
					to: '/studio/projects',
					icon: 'projects',
					label: 'Projects',
					count: projects.length,
				},
			],
		},
		{
			label: 'Library',
			items: [
				{
					to: '/studio/library/patterns',
					icon: 'view',
					label: 'Patterns',
					count: 0,
				},
				{ to: '/studio/library/yarns', icon: 'yarn', label: 'Yarns', count: 0 },
				{
					to: '/studio/library/tools',
					icon: 'tools',
					label: 'Tools',
					count: 0,
				},
			],
		},
		{
			label: 'Marketplace',
			items: [
				{
					to: '/studio/marketplace',
					icon: 'marketplace',
					label: 'Home',
					end: true,
				},
				{ to: '/studio/marketplace/browse', icon: 'browse', label: 'Browse' },
				{
					to: '/studio/marketplace/following',
					icon: 'community',
					label: 'Following',
					count: 0,
				},
				{ to: '/studio/marketplace/free', icon: 'gift', label: 'Free' },
				{
					to: '/studio/marketplace/wishlist',
					icon: 'wishlist',
					label: 'Wishlist',
					count: 0,
				},
			],
		},
	];

	return (
		<div className="flex min-h-0 flex-1 flex-col">
			<nav
				aria-label="Studio sections"
				className="flex-1 overflow-y-auto px-2 py-2"
			>
				{sections.map((section, index) => {
					// Associate each group with its label so the duplicate link names ("Patterns" under
					// both Workbench and Library, "Home" under both top-level and Marketplace) resolve in
					// context for screen readers, instead of reading as identical, ambiguous links.
					const labelId = section.label
						? `nav-section-${section.label.toLowerCase()}`
						: undefined;
					return (
						<div
							key={section.label ?? `section-${index}`}
							className={index > 0 ? 'mt-3' : undefined}
							{...(section.label && labelId
								? { role: 'group', 'aria-labelledby': labelId }
								: {})}
						>
							{section.label && (
								<p
									id={labelId}
									className="px-2 pb-1 pt-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground/80"
								>
									{section.label}
								</p>
							)}
							{section.items.map((item) => (
								<SidebarLink key={item.to} {...item} />
							))}
						</div>
					);
				})}
			</nav>
			<div className="border-t border-border p-2">
				<div className="flex items-center gap-2 rounded-md border border-border px-2.5 py-2 text-xs text-muted-foreground">
					<span
						className="size-2 shrink-0 rounded-full bg-yarn-fern"
						aria-hidden="true"
					/>
					<span className="flex-1">Saved in this browser</span>
					<Icon
						name="chevron-down"
						label=""
						className="size-3 shrink-0 opacity-60"
					/>
				</div>
			</div>
		</div>
	);
}

/** The craft picker (spec §2): scope the whole studio to a craft you work with. */
export function CraftPickerSlot() {
	const { scope, addedCrafts } = useCraftScope();
	const patterns = usePatternLibrary();
	const store = useStudioStore();
	const projects = store?.state.library.projects ?? [];
	const itemCrafts = [
		...patterns.map((pattern) => pattern.craft),
		...projects.flatMap((project) =>
			(project.makePatterns ?? []).map((ref) => ref.craft),
		),
	];
	const crafts = ownedCrafts(itemCrafts, addedCrafts);
	const addable = CRAFT_TAXONOMY.filter((craft) => !crafts.includes(craft));

	return (
		<InteriorSlot>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<button
						type="button"
						className="flex w-full items-center justify-between rounded-md border border-border px-2.5 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
					>
						<span>{craftLabel(scope)}</span>
						<Icon name="chevron-down" label="" className="size-3 opacity-60" />
					</button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="start" className="w-52">
					<ScopeItem
						active={scope === 'all'}
						onSelect={() => setCraftScope('all')}
					>
						All my crafts
					</ScopeItem>
					{crafts.map((craft) => (
						<ScopeItem
							key={craft}
							active={scope === craft}
							onSelect={() => setCraftScope(craft)}
						>
							{craftLabel(craft)}
						</ScopeItem>
					))}
					{addable.length > 0 && (
						<>
							<DropdownMenuSeparator />
							<DropdownMenuLabel>Add a craft</DropdownMenuLabel>
							{addable.map((craft) => (
								<DropdownMenuItem
									key={craft}
									onSelect={() => {
										addCraft(craft);
										setCraftScope(craft);
									}}
								>
									<Icon name="add" label="" /> {craftLabel(craft)}
								</DropdownMenuItem>
							))}
						</>
					)}
				</DropdownMenuContent>
			</DropdownMenu>
		</InteriorSlot>
	);
}

function ScopeItem({
	active,
	onSelect,
	children,
}: {
	active: boolean;
	onSelect: () => void;
	children: ReactNode;
}) {
	return (
		<DropdownMenuItem onSelect={onSelect}>
			<span className="min-w-0 flex-1 truncate">{children}</span>
			{active && <Icon name="confirm" label="active" />}
		</DropdownMenuItem>
	);
}

function SidebarLink({ to, icon, label, end, count }: NavItem) {
	return (
		<NavLink
			to={to}
			end={end}
			className={({ isActive }) =>
				cn(
					'flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] transition-colors [&_svg]:size-4 [&_svg]:shrink-0',
					isActive
						? 'bg-accent font-medium text-accent-foreground'
						: 'text-muted-foreground hover:bg-muted hover:text-foreground',
				)
			}
		>
			{({ isActive }) => (
				<>
					<Icon name={icon} label="" />
					<span className="min-w-0 flex-1 truncate">{label}</span>
					{count !== undefined && (
						<span
							className={cn(
								'text-[11px] tabular-nums',
								isActive
									? 'text-accent-foreground'
									: 'text-muted-foreground/70',
							)}
						>
							{count}
						</span>
					)}
				</>
			)}
		</NavLink>
	);
}

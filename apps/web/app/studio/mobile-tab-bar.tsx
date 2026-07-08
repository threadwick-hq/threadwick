import { cn } from '@threadwick/core/lib/utils';
import { Icon, type IconName } from '@threadwick/icons';
import { NavLink } from 'react-router';

type Tab = {
	to: string;
	icon: IconName;
	label: string;
	/** Exact-match active state (Home would otherwise light up on every /studio/* path). */
	end?: boolean;
};

// Spec §1: the mobile reduction of the sidebar to five glanceable, big-target tabs.
const TABS: Tab[] = [
	{ to: '/studio', icon: 'home', label: 'Home', end: true },
	{ to: '/studio/library/patterns', icon: 'view', label: 'Library' },
	{ to: '/studio/marketplace', icon: 'marketplace', label: 'Market' },
	{ to: '/studio/patterns', icon: 'add', label: 'Create' },
	{ to: '/studio/account', icon: 'account', label: 'Account' },
];

/**
 * The fixed bottom tab bar — the studio's global nav below the sidebar
 * breakpoint (the maker audience skews mobile). Shares the `min-[860px]`
 * boundary with the sidebar so exactly one is visible at a time.
 */
export function MobileTabBar() {
	return (
		<nav
			aria-label="Studio"
			className="fixed inset-x-0 bottom-0 z-40 flex h-16 border-t border-border bg-card min-[860px]:hidden"
		>
			{TABS.map((tab) => (
				<NavLink
					key={tab.to}
					to={tab.to}
					end={tab.end}
					className={({ isActive }) =>
						cn(
							'relative flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors [&_svg]:size-5',
							isActive
								? 'text-primary'
								: 'text-muted-foreground hover:text-foreground',
						)
					}
				>
					{({ isActive }) => (
						<>
							{isActive && (
								<span
									aria-hidden="true"
									className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-primary"
								/>
							)}
							<Icon name={tab.icon} label="" />
							<span>{tab.label}</span>
						</>
					)}
				</NavLink>
			))}
		</nav>
	);
}

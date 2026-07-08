import { isMarketplaceEnabled } from '@threadwick/core/capabilities';
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

// Spec §1: the mobile reduction of the sidebar to glanceable, big-target tabs.
// Section roots (no `end`) so a tab stays active across its subpaths, e.g.
// Library across /library/patterns · /yarns · /tools. The Market tab drops out
// when the marketplace capability is off.
const HOME: Tab = { to: '/studio', icon: 'home', label: 'Home', end: true };
const LIBRARY: Tab = { to: '/studio/library', icon: 'view', label: 'Library' };
const MARKET: Tab = {
	to: '/studio/marketplace',
	icon: 'marketplace',
	label: 'Market',
};
const CREATE: Tab = { to: '/studio/patterns', icon: 'add', label: 'Create' };
const ACCOUNT: Tab = {
	to: '/studio/account',
	icon: 'account',
	label: 'Account',
};

/**
 * The fixed bottom tab bar — the studio's global nav below the sidebar
 * breakpoint (the maker audience skews mobile). Shares the `min-[860px]`
 * boundary with the sidebar so exactly one is visible at a time.
 */
export function MobileTabBar() {
	const tabs: Tab[] = isMarketplaceEnabled()
		? [HOME, LIBRARY, MARKET, CREATE, ACCOUNT]
		: [HOME, LIBRARY, CREATE, ACCOUNT];
	return (
		<nav
			aria-label="Studio"
			// Grow by the iOS home-indicator inset and pad it out, so the tabs sit
			// in the top 4rem and nothing lands under the indicator.
			className="fixed inset-x-0 bottom-0 z-40 flex h-[calc(4rem+env(safe-area-inset-bottom))] border-t border-border bg-card pb-[env(safe-area-inset-bottom)] min-[860px]:hidden"
		>
			{tabs.map((tab) => (
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

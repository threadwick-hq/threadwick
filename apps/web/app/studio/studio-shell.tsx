import { Wordmark } from '@threadwick/core/brand';
import { InteriorSlot } from '@threadwick/core/components';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router';
import { useInteriorChrome } from './interior-chrome';
import { CraftPickerSlot, Sidebar } from './sidebar';

/**
 * StudioShell — the frame every Studio screen mounts into. Fixed-width chrome (the 244px
 * sidebar) plus a main area whose content is capped and centred app-wide via `max-w-uwd`, so
 * on ultra-wide displays the excess becomes calm margin rather than stretched layout.
 *
 * Follow mode is immersive on md+: global nav recedes to Follow's own back bar (TW-031).
 * Project/pattern interiors swap the craft-picker slot for an identity tile (TW-025/033).
 * The topbar lands in TW-022. Below `md` the sidebar is hidden (the mobile bottom tab bar is TW-024).
 */
export function StudioShell({ children }: { children: ReactNode }) {
	const location = useLocation();
	const immersiveFollow = /^\/studio\/follow\//.test(location.pathname);
	const interior = useInteriorChrome();

	return (
		<div className="h-dvh w-full overflow-hidden bg-background text-foreground">
			<a
				href="#studio-main"
				className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
			>
				Skip to content
			</a>
			{immersiveFollow ? (
				<main id="studio-main" className="h-full overflow-y-auto">
					{children}
				</main>
			) : (
				<div className="mx-auto flex h-full w-full max-w-uwd border-border md:border-x">
					<aside
						aria-label={interior ? 'Project navigation' : 'Studio sidebar'}
						className="hidden w-[244px] shrink-0 flex-col border-r border-border bg-card md:flex"
					>
						<div className="flex h-16 shrink-0 items-center border-b border-border px-5">
							<Wordmark />
						</div>
						{interior ? (
							<>
								<InteriorSlot>{interior.identityTile}</InteriorSlot>
								{interior.breadcrumb}
								{interior.rail}
								<div className="mt-auto border-t border-border p-2">{interior.pinnedTile}</div>
							</>
						) : (
							<>
								<CraftPickerSlot />
								<Sidebar />
							</>
						)}
					</aside>
					<main id="studio-main" className="min-w-0 flex-1 overflow-y-auto">
						{children}
					</main>
				</div>
			)}
		</div>
	);
}

import { Wordmark } from '@threadwick/core/brand';
import type { ReactNode } from 'react';

/**
 * StudioShell — the frame every Studio screen mounts into. Fixed-width chrome (the 244px
 * sidebar) plus a main area whose content is capped and centred app-wide via `max-w-uwd`, so
 * on ultra-wide displays the excess becomes calm margin rather than stretched layout.
 *
 * This is the layout skeleton only: the sidebar's nav lands in TW-021, the topbar in TW-022.
 * Below `md` the sidebar is hidden (the mobile bottom tab bar is TW-024).
 */
export function StudioShell({ children }: { children: ReactNode }) {
	return (
		<div className="h-dvh w-full overflow-hidden bg-background text-foreground">
			<div className="mx-auto flex h-full w-full max-w-uwd border-border md:border-x">
				<aside
					aria-label="Studio navigation"
					className="hidden w-[244px] shrink-0 flex-col border-r border-border bg-card md:flex"
				>
					<div className="flex h-16 shrink-0 items-center border-b border-border px-5">
						<Wordmark />
					</div>
					<nav className="flex-1 overflow-y-auto p-3">
						<p className="rounded-md px-2 py-1.5 text-xs text-muted-foreground">Navigation lands in TW-021.</p>
					</nav>
				</aside>
				<main id="studio-main" className="min-w-0 flex-1 overflow-y-auto">
					{children}
				</main>
			</div>
		</div>
	);
}

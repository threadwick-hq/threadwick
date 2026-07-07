import { isRouteErrorResponse, Outlet, useRouteError } from 'react-router';
import { InteriorChromeProvider } from '../studio/interior-chrome';
import { StudioShell } from '../studio/studio-shell';

export function meta() {
	return [{ title: 'Threadwick Studio' }];
}

/**
 * The Studio shell is a client-only, offline-capable app surface (it reads localStorage and, in
 * the editor, drives a DOM canvas), so the whole /studio subtree renders after hydration: a
 * `clientLoader` + `HydrateFallback` make the server emit only the shell skeleton.
 */
export async function clientLoader() {
	return null;
}
clientLoader.hydrate = true as const;

export function HydrateFallback() {
	return (
		<InteriorChromeProvider>
			<StudioShell>
				<div className="px-6 py-8">
					<p className="text-sm text-muted-foreground">Loading the studio…</p>
				</div>
			</StudioShell>
		</InteriorChromeProvider>
	);
}

export default function StudioLayout() {
	return (
		<InteriorChromeProvider>
			<StudioShell>
				<Outlet />
			</StudioShell>
		</InteriorChromeProvider>
	);
}

// Scoped boundary: a crash inside a studio screen keeps the shell (and the marketing site)
// alive. If StudioShell itself is the crash source, React Router falls through to root.tsx.
export function ErrorBoundary() {
	const error = useRouteError();
	const isNotFound = isRouteErrorResponse(error) && error.status === 404;
	return (
		<InteriorChromeProvider>
			<StudioShell>
				<div className="flex flex-col items-start gap-3 px-6 py-8">
					<h1 className="text-xl font-medium tracking-tight">
						{isNotFound
							? 'This studio page does not exist'
							: 'The studio hit an unexpected error'}
					</h1>
					<p className="text-sm text-muted-foreground">
						{isNotFound
							? 'Check the address, or head back to your workbench.'
							: 'Recent changes are saved on this device automatically. Reloading usually clears this up.'}
					</p>
					{import.meta.env.DEV && error instanceof Error ? (
						<pre className="max-w-full overflow-x-auto rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
							{error.message}
						</pre>
					) : null}
					<div className="flex items-center gap-4">
						{isNotFound ? null : (
							<button
								type="button"
								onClick={() => window.location.reload()}
								className="rounded-md border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted/40"
							>
								Reload the studio
							</button>
						)}
						<a
							href="/studio"
							className="text-sm underline underline-offset-4"
						>
							Back to the studio home
						</a>
					</div>
				</div>
			</StudioShell>
		</InteriorChromeProvider>
	);
}

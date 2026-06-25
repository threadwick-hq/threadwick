import { Outlet } from 'react-router';
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
		<StudioShell>
			<div className="px-6 py-8">
				<p className="text-sm text-muted-foreground">Loading the studio…</p>
			</div>
		</StudioShell>
	);
}

export default function StudioLayout() {
	return (
		<StudioShell>
			<Outlet />
		</StudioShell>
	);
}

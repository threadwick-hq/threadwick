import type { Route } from './+types/section';

/** Generic placeholder destination (Workbench, Library, Marketplace, …) until each screen is built. */
export default function StudioSection({ params }: Route.ComponentProps) {
	const path = params['*'] ?? '';
	const segments = path.split('/').filter(Boolean);
	const title = segments.at(-1) ?? 'Studio';
	const trail = segments.join(' / ');

	return (
		<div className="px-6 py-8">
			<h1 className="text-2xl font-medium capitalize tracking-tight">{title}</h1>
			{trail && <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground/80">{trail}</p>}
			<p className="mt-4 text-sm text-muted-foreground">
				This destination is a placeholder — its screen lands in a later Phase 6 task.
			</p>
		</div>
	);
}

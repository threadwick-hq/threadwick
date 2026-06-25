import type { Route } from './+types/section';

/** Generic placeholder destination (Workbench, Library, Marketplace, …) until each screen is built. */
export default function StudioSection({ params }: Route.ComponentProps) {
	return (
		<div className="px-6 py-8">
			<h1 className="text-2xl font-medium capitalize tracking-tight">{params.section}</h1>
			<p className="mt-1 text-sm text-muted-foreground">
				This destination is a placeholder — its screen lands in a later Phase 6 task.
			</p>
		</div>
	);
}

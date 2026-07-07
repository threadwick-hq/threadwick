/** The Studio's default destination — a placeholder until the real Home screen (a later Phase 6 task). */
export default function StudioHome() {
	return (
		<div className="px-6 py-8">
			<h1 className="text-2xl font-medium tracking-tight">Good afternoon</h1>
			<p className="mt-1 text-sm text-muted-foreground">
				Your work and the marketplace, all in one place.
			</p>
			<div className="mt-6 rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
				The Home screen lands in a later Phase 6 task. This is the shell's
				default destination — the sidebar and topbar fill in next (TW-021 /
				TW-022).
			</div>
		</div>
	);
}

import { Link } from 'react-router';
import { usePatternLibrary } from '../../studio/pattern-store';

export default function PatternsIndex() {
	const patterns = usePatternLibrary();

	return (
		<div className="px-6 py-8">
			<h1 className="text-2xl font-medium tracking-tight">Patterns</h1>
			<p className="mt-1 text-sm text-muted-foreground">
				Your authored designs — the full Workbench list lands in TW-041.
			</p>

			<section className="mt-8">
				<h2 className="text-sm font-medium">Marketplace demos</h2>
				<p className="mt-1 text-sm text-muted-foreground">
					Open view mode for the wildflower granny square — free or paid demo.
				</p>
				<ul className="mt-3 space-y-2">
					<li>
						<Link
							to="/studio/patterns/pat-wildflower-granny?view=1"
							className="block rounded-md border border-border px-4 py-3 text-sm font-medium hover:bg-muted/50"
						>
							Wildflower granny square — free
						</Link>
					</li>
					<li>
						<Link
							to="/studio/patterns/pat-wildflower-granny?view=1&paid=1"
							className="block rounded-md border border-border px-4 py-3 text-sm font-medium hover:bg-muted/50"
						>
							Wildflower granny square — $5.99 demo
						</Link>
					</li>
				</ul>
			</section>

			<section className="mt-8">
				<h2 className="text-sm font-medium">Your patterns</h2>
				<ul className="mt-3 space-y-2">
					{patterns.map((pattern) => (
						<li key={pattern.id}>
							<Link
								to={`/studio/patterns/${pattern.id}`}
								className="block rounded-md border border-border px-4 py-3 text-sm font-medium hover:bg-muted/50"
							>
								{pattern.overview.name}
							</Link>
						</li>
					))}
				</ul>
			</section>
		</div>
	);
}

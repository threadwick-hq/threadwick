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
			<ul className="mt-6 space-y-2">
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
		</div>
	);
}

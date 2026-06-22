const YARNS = ['brick', 'ochre', 'fern', 'teal', 'plum'] as const;

export function meta() {
	return [
		{ title: 'Threadwick' },
		{ name: 'description', content: 'A home for fiber artists.' },
	];
}

export default function Home() {
	return (
		<main className="mx-auto min-h-dvh max-w-3xl p-8">
			<header className="flex items-baseline gap-3">
				<h1 className="font-display text-3xl font-medium text-primary">threadwick</h1>
				<span className="rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground">
					design system
				</span>
			</header>

			<p className="mt-2 text-muted-foreground">
				Brick &amp; Ecru on Tailwind — verifying the theme renders straight from the OKLCH tokens.
			</p>

			<div className="mt-6 flex flex-wrap gap-3">
				<button
					type="button"
					className="inline-flex h-11 items-center rounded-lg bg-primary px-4 text-primary-foreground"
				>
					Publish pattern
				</button>
				<button
					type="button"
					className="inline-flex h-11 items-center rounded-lg border border-border bg-card px-4 text-card-foreground"
				>
					Open in Studio
				</button>
			</div>

			<section className="mt-8 rounded-xl border border-border bg-card p-5">
				<p className="text-sm font-medium">Granny square sampler</p>
				<p className="mt-1 text-sm text-muted-foreground">4 components · merino &amp; cotton · 4 mm hook</p>
				<div className="mt-4 flex gap-2">
					{YARNS.map((yarn) => (
						<span
							key={yarn}
							className="size-6 rounded-full border border-border"
							style={{ background: `var(--tw-yarn-${yarn})` }}
						/>
					))}
				</div>
			</section>
		</main>
	);
}

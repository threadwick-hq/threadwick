import { Button, Card, CardContent, CardHeader, CardTitle, Input } from '@threadwick/core/components';

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
				<h1 className="font-display text-3xl font-medium text-brand">threadwick</h1>
				<span className="rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground">
					design system
				</span>
			</header>

			<p className="mt-2 text-muted-foreground">
				shadcn components on Brick &amp; Ecru — themed straight from the OKLCH tokens.
			</p>

			<div className="mt-6 flex flex-wrap gap-3">
				<Button>Publish pattern</Button>
				<Button variant="outline">Open in Studio</Button>
				<Button variant="secondary">Save</Button>
				<Button variant="ghost">Cancel</Button>
			</div>

			<Card className="mt-8 max-w-md">
				<CardHeader>
					<CardTitle>Granny square sampler</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<p className="text-sm text-muted-foreground">4 components · merino &amp; cotton · 4 mm hook</p>
					<Input placeholder="Project name" defaultValue="Granny square sampler" />
					<div className="flex gap-2">
						{YARNS.map((yarn) => (
							<span
								key={yarn}
								className="size-6 rounded-full border border-border"
								style={{ background: `var(--tw-yarn-${yarn})` }}
							/>
						))}
					</div>
				</CardContent>
			</Card>
		</main>
	);
}

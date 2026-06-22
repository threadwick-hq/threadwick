import { Wordmark } from '@threadwick/core/brand';

const NAV = [
	{ href: '#promise', label: 'Our promise' },
	{ href: '#roadmap', label: 'What’s coming' },
	{ href: '#features', label: 'Features' },
	{ href: '#how-it-works', label: 'How it works' },
	{ href: '#faq', label: 'FAQ' },
];

export function Footer() {
	const year = new Date().getFullYear();
	return (
		<footer className="border-t border-border bg-card">
			<div className="mx-auto max-w-6xl px-6 py-10">
				<div className="flex flex-wrap items-start justify-between gap-6">
					<div className="max-w-xs">
						<Wordmark showTagline />
						<p className="mt-3.5 text-sm text-muted-foreground">
							Fair tools for fiber artists and makers. Built for the people who make — not investors.
						</p>
					</div>
					<nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2.5">
						{NAV.map((link) => (
							<a key={link.href} href={link.href} className="text-sm text-muted-foreground hover:text-foreground">
								{link.label}
							</a>
						))}
						<a href="/studio" className="text-sm text-muted-foreground hover:text-foreground">
							Open Studio
						</a>
					</nav>
				</div>
				<div className="mt-7 border-t border-border pt-4 text-sm text-muted-foreground">© {year} Threadwick</div>
			</div>
		</footer>
	);
}

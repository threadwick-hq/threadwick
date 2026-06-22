import { Icon, type IconName } from '@threadwick/icons';

type Pledge = { icon: IconName; title: string; body: string };

const PLEDGES: Pledge[] = [
	{
		icon: 'community',
		title: 'Built for fiber artists & makers',
		body: 'Made by and for the people who design patterns and the people who make from them. Every decision starts with you — not growth charts.',
	},
	{
		icon: 'gift',
		title: 'Free to make, always',
		body: 'The studio is free to use: design, chart, organize and export without paying. Sell your work yourself, outside Threadwick, and we never take a cent — that’s by design.',
	},
	{
		icon: 'earnings',
		title: 'You keep what you earn',
		body: 'Selling through Threadwick is entirely optional. If you choose it, fees are small, flat and shown up front, you keep the large majority — and pricing flexes with where you live and what you can spend.',
	},
	{
		icon: 'no-lock-in',
		title: 'No lock-in, no tricks',
		body: 'Your work is yours — export it anytime in open formats and leave whenever you like. No manipulative upsells, no engagement traps, no selling your data.',
	},
];

/** "Our promise" — the fairness manifesto, set as a full-bleed ink band (statement piece). */
export function OurPromise() {
	return (
		<section id="promise" aria-labelledby="promise-title" className="bg-foreground text-background">
			<div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
				<div className="mx-auto mb-10 max-w-2xl text-center">
					<p className="mb-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-brand">Our promise</p>
					<h2
						id="promise-title"
						className="font-display text-[clamp(1.625rem,3.6vw,2.25rem)] font-medium tracking-tight"
					>
						Fair tools for fiber artists &amp; makers
					</h2>
					<p className="mt-3.5 text-base leading-relaxed opacity-80">
						This isn’t a tagline — it’s how we make decisions. The tools are free; paying only ever
						enters the picture if you choose to sell through the platform. That’s how we’re building
						Threadwick to be fair to the artists who design patterns and the makers who follow them.
					</p>
				</div>
				<ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
					{PLEDGES.map((pledge) => (
						<li key={pledge.title} className="text-center">
							<span
								aria-hidden
								className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-brand text-primary-foreground [&_svg]:size-6"
							>
								<Icon name={pledge.icon} label="" />
							</span>
							<h3 className="font-display text-lg font-medium">{pledge.title}</h3>
							<p className="mt-2 text-sm leading-relaxed opacity-75">{pledge.body}</p>
						</li>
					))}
				</ul>
			</div>
		</section>
	);
}

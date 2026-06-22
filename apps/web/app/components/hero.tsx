import { Icon } from '@threadwick/icons';
import { OpenStudioButton } from './open-studio-button';

export function Hero() {
	return (
		<section aria-labelledby="hero-title" className="mx-auto max-w-5xl px-6 py-20 sm:py-28">
			<div className="max-w-3xl">
				<p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
					Fair tools for fiber artists &amp; makers
				</p>

				<h1
					id="hero-title"
					className="mt-3 font-display text-[clamp(2.25rem,6.5vw,3.75rem)] font-medium leading-[1.04] tracking-tight text-foreground"
				>
					Design your stitches the way you make them
				</h1>

				<p className="mt-5 max-w-xl text-lg text-muted-foreground">
					Threadwick Studio is where you chart your designs stitch by stitch — and keep every
					project&rsquo;s patterns, yarns, links and notes together in one tidy place.
				</p>

				<div className="mt-8 flex flex-wrap items-center gap-4">
					<OpenStudioButton />
					<span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
						<Icon name="private" label="" />
						Free in your browser — no account needed
					</span>
				</div>

				<p className="mt-5 text-sm text-muted-foreground">
					Fair by design — free to use, no lock-in, and selling through us is always optional.{' '}
					<a href="#promise" className="font-medium text-primary underline-offset-4 hover:underline">
						Our promise &rarr;
					</a>
				</p>
			</div>
		</section>
	);
}

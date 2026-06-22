import { Wordmark } from '@threadwick/core/brand';
import { OpenStudioButton } from './open-studio-button';

/** Sticky, minimal header: wordmark (with tagline) + the single CTA. */
export function Header() {
	return (
		<header className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-md backdrop-saturate-150">
			<div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-6">
				<Wordmark showTagline />
				<OpenStudioButton size="default" />
			</div>
		</header>
	);
}

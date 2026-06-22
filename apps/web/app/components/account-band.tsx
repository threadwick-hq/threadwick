import { OpenStudioButton } from './open-studio-button';

export function AccountBand() {
	return (
		<section aria-labelledby="account-title" className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
			<div className="rounded-2xl border border-border bg-accent px-6 py-12 text-center sm:px-14 sm:py-16">
				<h2
					id="account-title"
					className="font-display text-[clamp(1.625rem,3.6vw,2.375rem)] font-medium tracking-tight text-foreground"
				>
					A home for fiber artists
				</h2>
				<p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
					Start free right in your browser — your work stays with you. Create a free account when
					you’re ready for more: sync across your devices, keep cloud backups, and share your
					patterns. Your work is always yours — export it and walk away anytime, no lock-in.
				</p>
				<div className="mt-7">
					<OpenStudioButton />
				</div>
			</div>
		</section>
	);
}

import { Card } from '@threadwick/core/components';
import { Icon, type IconName } from '@threadwick/icons';
import { SectionHeading } from './section-heading';

type Feature = { icon: IconName; title: string; body: string };

const FEATURES: Feature[] = [
	{
		icon: 'organize',
		title: 'Everything in one place',
		body: 'Keep the patterns, yarns, links and notes for a project together, so nothing gets lost between makes.',
	},
	{
		icon: 'draft',
		title: 'Drafts and versions',
		body: 'Tinker freely. Keep drafts, mark a pattern finished, and come back to an earlier version whenever you like.',
	},
	{
		icon: 'share-qr',
		title: 'Print and share',
		body: 'Print clean, readable PDFs, save your charts as images, and share a pattern with a quick QR link.',
	},
	{
		icon: 'private',
		title: 'Yours and private',
		body: 'Threadwick runs right in your browser. Your projects stay with you — private by default, nothing to install.',
	},
	{
		icon: 'sync',
		title: 'Always free',
		body: 'Use it free with no account. Sign in when you want to sync, back up, and reach your work across devices.',
	},
	{
		icon: 'symbols',
		title: 'Symbols you already know',
		body: 'Charts are drawn with the standard crochet symbols, so anyone who reads patterns can follow along.',
	},
];

export function Features() {
	return (
		<section
			id="features"
			aria-labelledby="features-title"
			className="mx-auto max-w-5xl px-6 py-16 sm:py-20"
		>
			<SectionHeading
				id="features-title"
				eyebrow="What you get"
				title="Made for keeping projects together"
				lead="Everything you need to chart, save and share your projects — without the clutter."
				align="center"
			/>
			<div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
				{FEATURES.map((feature) => (
					<Card key={feature.title} className="p-6">
						<span
							aria-hidden
							className="mb-3.5 grid size-11 place-items-center rounded-lg bg-accent text-accent-foreground [&_svg]:size-5"
						>
							<Icon name={feature.icon} label="" />
						</span>
						<h3 className="font-display text-lg font-medium text-foreground">
							{feature.title}
						</h3>
						<p className="mt-2 text-sm leading-relaxed text-muted-foreground">
							{feature.body}
						</p>
					</Card>
				))}
			</div>
		</section>
	);
}

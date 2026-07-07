import { SectionHeading } from './section-heading';

type Step = { title: string; body: string };

const STEPS: Step[] = [
	{
		title: 'Open the studio',
		body: 'No download, no sign-up. Threadwick opens in your browser and you can start straight away.',
	},
	{
		title: 'Place your stitches',
		body: 'Add stitches in the order you’d crochet them. The chart grows as you go and lines everything up for you.',
	},
	{
		title: 'Save, print or share',
		body: 'Export a tidy PDF or image, print it for your project bag, or share it with a QR link.',
	},
];

export function HowItWorks() {
	return (
		<section
			id="how-it-works"
			aria-labelledby="how-it-works-title"
			className="border-y border-border bg-card"
		>
			<div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
				<SectionHeading
					id="how-it-works-title"
					eyebrow="Three simple steps"
					title="From idea to chart in minutes"
					align="center"
				/>
				<div className="grid gap-6 md:grid-cols-3">
					{STEPS.map((step, index) => (
						<div
							key={step.title}
							className="h-full rounded-xl border border-border bg-background p-6"
						>
							<span
								aria-hidden
								className="mb-4 grid size-11 place-items-center rounded-full bg-primary font-display text-lg font-bold text-primary-foreground"
							>
								{index + 1}
							</span>
							<h3 className="font-display text-lg font-medium text-foreground">
								{step.title}
							</h3>
							<p className="mt-2 text-sm leading-relaxed text-muted-foreground">
								{step.body}
							</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

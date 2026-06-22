import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@threadwick/core/components';
import { Icon } from '@threadwick/icons';
import { useState } from 'react';
import type { CrochetRegion } from '../data/stitches';
import { SectionHeading } from './section-heading';
import { StitchLegend } from './stitch-legend';

const POINTS = [
	'Place stitches in the order you’d crochet them — the chart grows round by round as you go.',
	'No fiddly counting or symmetry math; Threadwick works out the spacing for you.',
	'Charts use the standard crochet symbols, so they’re easy for anyone to read.',
];

export function DesignApproach() {
	const [region, setRegion] = useState<CrochetRegion>('US');

	return (
		<section id="design-approach" aria-labelledby="approach-title" className="border-y border-border bg-card">
			<div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
				<div className="grid items-center gap-10 md:grid-cols-[13fr_11fr]">
					{/* Text is first in the DOM (mobile reads heading-first); desktop puts the tiles left. */}
					<div className="md:order-2">
						<SectionHeading
							id="approach-title"
							eyebrow="Crochet · granny squares"
							title="Chart granny squares the way you crochet them"
							lead="Threadwick Studio starts with crochet granny squares. Build a chart stitch by stitch — it follows how you actually crochet and keeps every round lined up, with no graph-paper guesswork."
						/>
						<ul className="grid list-none gap-3.5 p-0">
							{POINTS.map((point) => (
								<li key={point} className="flex items-start gap-3">
									<span
										aria-hidden
										className="mt-0.5 grid size-6 flex-none place-items-center rounded-full bg-primary text-primary-foreground [&_svg]:size-3"
									>
										<Icon name="confirm" label="" />
									</span>
									<span className="text-base text-muted-foreground">{point}</span>
								</li>
							))}
						</ul>
					</div>

					<div className="md:order-1">
						<div className="mb-3.5 flex flex-wrap items-center justify-between gap-3">
							<h3 className="text-base font-medium text-foreground">The symbols you’ll see</h3>
							<Select value={region} onValueChange={(value) => setRegion(value === 'UK' ? 'UK' : 'US')}>
								<SelectTrigger className="w-28" aria-label="Choose crochet terminology">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="US">US terms</SelectItem>
									<SelectItem value="UK">UK terms</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<StitchLegend region={region} />
					</div>
				</div>
			</div>
		</section>
	);
}

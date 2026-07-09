import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@threadwick/core/ui';
import { SectionHeading } from './section-heading';

type Faq = { q: string; a: string };

const FAQS: Faq[] = [
	{
		q: 'Is Threadwick free?',
		a: 'Yes. The studio is free to use right in your browser, and an optional free account adds syncing and backups across your devices. The only paid features are for artists who choose to sell on or through the platform.',
	},
	{
		q: 'Do I need an account?',
		a: 'No. You can design, save and export without one. Sign in only when you want to sync your work, keep cloud backups, or share patterns more easily.',
	},
	{
		q: 'When would I ever pay?',
		a: 'Only if you choose to sell on or through the platform — like the upcoming marketplace. Designing, charting, exporting, and selling your patterns yourself outside Threadwick is free, and that’s by design.',
	},
	{
		q: 'What can I export?',
		a: 'You can save your charts as images, print clean PDFs for your project bag, and share a pattern with a QR link that opens it for someone else.',
	},
	{
		q: 'What’s a granny-square chart?',
		a: 'It’s a stitch-by-stitch map of a crochet square drawn with standard symbols — chains, clusters and spaces — so you can see exactly how each round is worked.',
	},
	{
		q: 'Is Threadwick only for crochet?',
		a: 'That’s where it starts. Today the studio focuses on crochet granny-square charts, and it’s growing — Threadwick is built to be a home for fiber artists of all kinds.',
	},
];

export function Faq() {
	return (
		<section
			id="faq"
			aria-labelledby="faq-title"
			className="border-t border-border bg-card"
		>
			<div className="mx-auto max-w-2xl px-6 py-16 sm:py-20">
				<SectionHeading
					id="faq-title"
					eyebrow="Questions"
					title="Good to know"
					align="center"
				/>
				<Accordion
					type="single"
					collapsible
					defaultValue="faq-0"
					className="w-full"
				>
					{FAQS.map((faq, index) => (
						<AccordionItem key={faq.q} value={`faq-${index}`}>
							<AccordionTrigger>{faq.q}</AccordionTrigger>
							<AccordionContent>{faq.a}</AccordionContent>
						</AccordionItem>
					))}
				</Accordion>
			</div>
		</section>
	);
}

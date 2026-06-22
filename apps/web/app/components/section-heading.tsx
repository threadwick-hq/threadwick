import { cn } from '@threadwick/core/lib/utils';

type SectionHeadingProps = {
	id: string;
	eyebrow?: string;
	title: string;
	lead?: string;
	align?: 'left' | 'center';
};

/** Consistent section header: eyebrow + <h2> (anchor target) + optional lead. */
export function SectionHeading({ id, eyebrow, title, lead, align = 'left' }: SectionHeadingProps) {
	const centered = align === 'center';
	return (
		<div className={cn('mb-10', centered && 'mx-auto max-w-2xl text-center')}>
			{eyebrow ? (
				<p className="mb-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-primary">{eyebrow}</p>
			) : null}
			<h2
				id={id}
				className="font-display text-[clamp(1.625rem,3.6vw,2.25rem)] font-medium tracking-tight text-foreground"
			>
				{title}
			</h2>
			{lead ? (
				<p className={cn('mt-3.5 max-w-xl text-lg text-muted-foreground', centered && 'mx-auto')}>{lead}</p>
			) : null}
		</div>
	);
}

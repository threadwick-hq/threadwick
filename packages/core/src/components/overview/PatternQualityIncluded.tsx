import { Icon } from '@threadwick/icons';
import { cn } from '../../lib/utils';

export type PatternQualityIncludedItem = {
	id: string;
	label: string;
};

export type PatternQualityIncludedProps = {
	items: PatternQualityIncludedItem[];
	title?: string;
	className?: string;
};

/** View-mode what's-included signals — present checks only (§4.5). */
export function PatternQualityIncluded({
	items,
	title = "What's included",
	className,
}: PatternQualityIncludedProps) {
	if (items.length === 0) return null;

	return (
		<section className={className} aria-label={title}>
			<h2 className="mb-1 text-[11px] uppercase tracking-wide text-muted-foreground">
				{title}
			</h2>
			<ul className="max-w-xl divide-y divide-border rounded-md border border-border bg-card px-3">
				{items.map((item) => (
					<li
						key={item.id}
						className="flex items-center gap-2.5 py-2 text-[12.5px] text-foreground"
					>
						<span
							className={cn(
								'flex size-4 shrink-0 items-center justify-center rounded border',
								'border-yarn-fern bg-yarn-fern text-primary-foreground',
							)}
							aria-hidden
						>
							<Icon name="confirm" label="" className="size-2.5" />
						</span>
						<span>{item.label}</span>
					</li>
				))}
			</ul>
		</section>
	);
}

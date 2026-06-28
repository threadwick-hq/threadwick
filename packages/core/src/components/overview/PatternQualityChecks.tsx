import { Icon } from '@threadwick/icons';
import { cn } from '../../lib/utils';

export type PatternQualityCheckItem = {
	id: string;
	label: string;
	present: boolean;
	tier: 'floor' | 'optional';
};

export type PatternQualityChecksProps = {
	checks: PatternQualityCheckItem[];
	title?: string;
	className?: string;
};

/** Edit-mode quality audit — present = checked; missing = muted add-to-strengthen (§4.5). */
export function PatternQualityChecks({
	checks,
	title = 'Quality checks',
	className,
}: PatternQualityChecksProps) {
	if (checks.length === 0) return null;

	return (
		<section className={className} aria-label={title}>
			<h2 className="mb-1 text-[11px] uppercase tracking-wide text-muted-foreground">
				{title}
			</h2>
			<ul className="max-w-xl divide-y divide-border rounded-md border border-border bg-card px-3">
				{checks.map((check) => (
					<li
						key={check.id}
						className="flex items-start gap-2.5 py-2 text-[12.5px]"
					>
						<span
							className={cn(
								'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border',
								check.present
									? 'border-yarn-fern bg-yarn-fern text-primary-foreground'
									: 'border-border bg-background',
							)}
							aria-hidden
						>
							{check.present ? (
								<Icon name="confirm" label="" className="size-2.5" />
							) : null}
						</span>
						<span className="min-w-0 flex-1">
							<span
								className={cn(
									check.present ? 'text-foreground' : 'text-muted-foreground',
								)}
							>
								{check.label}
							</span>
							{!check.present ? (
								<span className="mt-0.5 block text-[11px] text-muted-foreground">
									Add to strengthen
								</span>
							) : null}
						</span>
					</li>
				))}
			</ul>
		</section>
	);
}

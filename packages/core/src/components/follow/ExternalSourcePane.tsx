import { Icon } from '@threadwick/icons';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

export type ExternalSourcePaneProps = {
	label: string;
	sourceLabel: string;
	sourceHref?: string;
	designer?: string;
	className?: string;
};

/** Chart-pane fallback for external patterns — open Ravelry, blog, or PDF source. */
export function ExternalSourcePane({
	label,
	sourceLabel,
	sourceHref,
	designer,
	className,
}: ExternalSourcePaneProps) {
	return (
		<div
			className={cn(
				'flex min-h-[220px] flex-col items-center justify-center rounded-lg border border-border bg-muted/30 px-6 py-8 text-center md:min-h-[280px]',
				className,
			)}
		>
			<div className="mb-4 flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
				<Icon name="open-external" label="" className="size-6" />
			</div>
			<p className="text-sm font-medium text-foreground">{label}</p>
			{designer ? (
				<p className="mt-1 text-xs text-muted-foreground">{designer}</p>
			) : null}
			<p className="mt-3 max-w-xs text-xs leading-relaxed text-muted-foreground">
				No structured chart — track rounds with the checklist or open your
				pattern source.
			</p>
			{sourceHref ? (
				<Button variant="secondary" size="sm" className="mt-5" asChild>
					<a href={sourceHref} target="_blank" rel="noopener noreferrer">
						<Icon name="open-external" label="" className="size-4" />
						{sourceLabel}
					</a>
				</Button>
			) : (
				<p className="mt-5 text-xs text-muted-foreground">
					No source link on this reference.
				</p>
			)}
		</div>
	);
}

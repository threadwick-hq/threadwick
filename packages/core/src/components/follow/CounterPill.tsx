import { Icon } from '@threadwick/icons';
import { cn } from '../../lib/utils';

export type CounterPillIcon = 'round' | 'repeat' | 'stitch';

const PILL_ICONS: Record<CounterPillIcon, 'patterns' | 'refresh' | 'symbols'> = {
	round: 'patterns',
	repeat: 'refresh',
	stitch: 'symbols',
};

export type CounterPillProps = {
	icon: CounterPillIcon;
	label: string;
	value: string;
	className?: string;
};

/** Display-only informative counter pill (Round, Rep, St). */
export function CounterPill({ icon, label, value, className }: CounterPillProps) {
	return (
		<span
			className={cn(
				'inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground',
				className,
			)}
		>
			<Icon name={PILL_ICONS[icon]} label="" className="size-3.5 shrink-0" />
			<span>
				{label}{' '}
				<b className="font-medium text-foreground">{value}</b>
			</span>
		</span>
	);
}

export function CounterPillRow({
	pills,
	className,
}: {
	pills: CounterPillProps[];
	className?: string;
}) {
	if (!pills.length) return null;
	return (
		<div className={cn('flex flex-wrap gap-2', className)}>
			{pills.map((pill) => (
				<CounterPill key={`${pill.label}-${pill.value}`} {...pill} />
			))}
		</div>
	);
}

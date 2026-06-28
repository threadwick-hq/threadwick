import { cn } from '../../lib/utils';

export type KeyFactTileProps = {
	label: string;
	value: string;
	className?: string;
};

/** White key-fact tile with hairline border (§5 overview). */
export function KeyFactTile({ label, value, className }: KeyFactTileProps) {
	return (
		<div
			className={cn(
				'rounded-md border border-border bg-card px-3 py-2.5',
				className,
			)}
		>
			<p className="text-[11px] text-muted-foreground">{label}</p>
			<p className="mt-0.5 text-[13px] font-medium tabular-nums">{value}</p>
		</div>
	);
}

export type KeyFactsGridProps = {
	facts: KeyFactTileProps[];
	className?: string;
};

export function KeyFactsGrid({ facts, className }: KeyFactsGridProps) {
	if (facts.length === 0) return null;
	return (
		<div
			className={cn(
				'grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3',
				className,
			)}
		>
			{facts.map((fact) => (
				<KeyFactTile key={fact.label} {...fact} />
			))}
		</div>
	);
}

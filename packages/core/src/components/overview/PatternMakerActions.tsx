import { Icon } from '@threadwick/icons';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';

export type PatternMakerActionsProps = {
	priceLabel: string;
	primaryLabel: string;
	onPrimary: () => void;
	onRemix: () => void;
	className?: string;
};

/** View-mode price + Start making / Buy / Remix row (§4.4). */
export function PatternMakerActions({
	priceLabel,
	primaryLabel,
	onPrimary,
	onRemix,
	className,
}: PatternMakerActionsProps) {
	return (
		<div className={cn('flex flex-wrap items-center gap-3', className)}>
			<span className="text-lg font-medium tabular-nums">{priceLabel}</span>
			<Button
				type="button"
				className="h-9 gap-1.5 px-4 text-[13px]"
				onClick={onPrimary}
			>
				<Icon name="make-it" label="" className="size-4" />
				{primaryLabel}
			</Button>
			<Button
				type="button"
				variant="outline"
				className="h-9 px-4 text-[13px]"
				onClick={onRemix}
			>
				Remix
			</Button>
		</div>
	);
}

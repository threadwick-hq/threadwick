import { Icon } from '@threadwick/icons';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

export type FollowFooterProps = {
	percent: number;
	actionLabel: string;
	onAction: () => void;
	onUndo: () => void;
	canUndo: boolean;
	actionDisabled?: boolean;
	className?: string;
};

/** Footer progress bar, one big action, and one-step Undo (§6). */
export function FollowFooter({
	percent,
	actionLabel,
	onAction,
	onUndo,
	canUndo,
	actionDisabled,
	className,
}: FollowFooterProps) {
	return (
		<div
			className={cn(
				'border-t border-border px-4 pt-3 pb-5 mt-1.5',
				className,
			)}
		>
			<div
				className="mb-3 h-1.5 overflow-hidden rounded-full bg-muted"
				role="progressbar"
				aria-valuenow={percent}
				aria-valuemin={0}
				aria-valuemax={100}
			>
				<div
					className="h-full rounded-full bg-primary transition-[width] duration-200"
					style={{ width: `${percent}%` }}
				/>
			</div>
			<div className="flex gap-2">
				<Button
					type="button"
					size="lg"
					className="h-[54px] flex-1 text-base font-medium"
					onClick={onAction}
					disabled={actionDisabled}
				>
					<Icon name="confirm" label="" className="size-5" />
					{actionLabel}
				</Button>
				<Button
					type="button"
					variant="outline"
					size="lg"
					className="h-[54px] shrink-0"
					onClick={onUndo}
					disabled={!canUndo}
					aria-label="Undo last step"
				>
					<Icon name="undo" label="Undo" />
				</Button>
			</div>
		</div>
	);
}

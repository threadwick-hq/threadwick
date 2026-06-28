import { Icon } from '@threadwick/icons';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';

export type FollowFooterProps = {
	percent: number;
	actionLabel: string;
	onAction: () => void;
	onUndo: () => void;
	canUndo: boolean;
	actionDisabled?: boolean;
	/** Stacked (phone/tablet-portrait) vs inline progress+action (side-by-side). */
	layout?: 'stacked' | 'inline';
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
	layout = 'stacked',
	className,
}: FollowFooterProps) {
	const progressBar = (
		<div
			className={cn(
				'h-1.5 overflow-hidden rounded-full bg-muted',
				layout === 'stacked' ? 'mb-3' : 'flex-1',
			)}
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
	);

	const actions = (
		<div className={cn('flex gap-2', layout === 'inline' && 'shrink-0')}>
			<Button
				type="button"
				size="lg"
				className={cn(
					'h-[54px] text-base font-medium',
					layout === 'stacked' ? 'flex-1' : 'min-w-[190px]',
				)}
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
	);

	return (
		<div
			className={cn(
				'border-t border-border px-4 pt-3 pb-5 mt-1.5',
				layout === 'inline' &&
					'mt-3.5 flex items-center gap-3.5 border-t-0 px-0 pt-0 pb-0 md:px-0',
				className,
			)}
		>
			{layout === 'inline' ? (
				<>
					{progressBar}
					{actions}
				</>
			) : (
				<>
					{progressBar}
					{actions}
				</>
			)}
		</div>
	);
}

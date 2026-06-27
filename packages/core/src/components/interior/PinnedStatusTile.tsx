import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';

export type PinnedStatusTileProps = {
	statusSelector: ReactNode;
	percent: number;
	progressLabel?: string;
	continueAction: ReactNode;
	className?: string;
};

/** Pinned bottom-of-rail tile: state selector + aggregated progress + Continue making (§5). */
export function PinnedStatusTile({
	statusSelector,
	percent,
	progressLabel,
	continueAction,
	className,
}: PinnedStatusTileProps) {
	return (
		<div className={cn('rounded-md border border-border p-2.5', className)}>
			<p className="text-[11px] text-muted-foreground">Status</p>
			<div className="mt-1">{statusSelector}</div>
			<div className="mt-3">
				<div className="mb-1 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
					<span>{progressLabel ?? 'Overall progress'}</span>
					<span className="tabular-nums">{percent}%</span>
				</div>
				<div
					className="h-1.5 overflow-hidden rounded-full bg-muted"
					role="progressbar"
					aria-valuenow={percent}
					aria-valuemin={0}
					aria-valuemax={100}
					aria-label={progressLabel ?? 'Overall progress'}
				>
					<div
						className="h-full rounded-full bg-primary transition-[width] duration-200"
						style={{ width: `${percent}%` }}
					/>
				</div>
			</div>
			<div className="mt-3">{continueAction}</div>
		</div>
	);
}

export type PinnedStatusContinueButtonProps = {
	children: ReactNode;
	className?: string;
	disabled?: boolean;
	onClick?: () => void;
};

export function PinnedStatusContinueButton({
	children,
	className,
	disabled,
	onClick,
}: PinnedStatusContinueButtonProps) {
	return (
		<Button
			type="button"
			className={cn('h-9 w-full gap-1.5 text-[13px] font-medium', className)}
			disabled={disabled}
			onClick={onClick}
		>
			{children}
		</Button>
	);
}

import type { ComponentProps, ReactNode } from 'react';
import { cn } from '../../lib/utils';

type EmptyStateProps = {
	title: string;
	description?: string;
	/** Call-to-action slot, e.g. a Button or Link. */
	action?: ReactNode;
} & ComponentProps<'div'>;

/**
 * EmptyState — the calm "nothing here yet" tile: white surface + hairline
 * border, centered copy, optional call to action.
 */
export function EmptyState({
	title,
	description,
	action,
	className,
	...props
}: EmptyStateProps) {
	return (
		<div
			role="status"
			className={cn(
				'flex flex-col items-center gap-2 rounded-xl border border-border bg-card px-6 py-12 text-center',
				className,
			)}
			{...props}
		>
			<div className="text-sm font-medium">{title}</div>
			{description ? (
				<div className="max-w-sm text-sm text-muted-foreground">
					{description}
				</div>
			) : null}
			{action ? <div className="mt-2">{action}</div> : null}
		</div>
	);
}

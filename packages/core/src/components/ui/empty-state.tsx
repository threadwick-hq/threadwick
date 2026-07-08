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
 * border, centered copy, optional call to action. Statically rendered (no
 * live region) — pass role="status" via props when it replaces list results
 * dynamically and the change should be announced.
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
			className={cn(
				'flex flex-col items-center gap-2 rounded-xl border border-border bg-card px-6 py-12 text-center',
				className,
			)}
			{...props}
		>
			<h3 className="text-sm font-medium">{title}</h3>
			{description ? (
				<div className="max-w-sm text-sm text-muted-foreground">
					{description}
				</div>
			) : null}
			{action ? <div className="mt-2">{action}</div> : null}
		</div>
	);
}

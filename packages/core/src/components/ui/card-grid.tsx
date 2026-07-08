import type { ComponentProps } from 'react';
import { cn } from '../../lib/utils';

/**
 * CardGrid — the responsive photo-card grid: auto-fill columns from mobile up.
 * The UWD cap-and-center rule lives at the consuming layout, not here.
 */
export function CardGrid({ className, ...props }: ComponentProps<'div'>) {
	return (
		<div
			className={cn(
				'grid grid-cols-[repeat(auto-fill,minmax(13rem,1fr))] gap-4',
				className,
			)}
			{...props}
		/>
	);
}

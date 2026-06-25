import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import type { ComponentProps } from 'react';
import { cn } from '../../lib/utils';

/**
 * Tooltip — shadcn/ui on Radix, themed Brick & Ecru (dark spotlight on light UI).
 * Wrap an interactive trigger; keep the label short. Mount one `TooltipProvider`
 * near the root so a shared delay/skip timer applies across the surface.
 */
export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export function TooltipContent({
	className,
	sideOffset = 6,
	...props
}: ComponentProps<typeof TooltipPrimitive.Content>) {
	return (
		<TooltipPrimitive.Portal>
			<TooltipPrimitive.Content
				sideOffset={sideOffset}
				className={cn(
					'z-50 overflow-hidden rounded-md bg-foreground px-2.5 py-1.5 text-xs text-background shadow-md',
					className,
				)}
				{...props}
			/>
		</TooltipPrimitive.Portal>
	);
}

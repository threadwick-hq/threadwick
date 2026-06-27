import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

/** Fixed-height slot shared by the craft picker (global nav) and the interior identity tile (TW-025). */
export const INTERIOR_SLOT_CLASS =
	'flex min-h-[52px] shrink-0 items-center border-b border-border px-2 py-2';

export type InteriorSlotProps = {
	children: ReactNode;
	className?: string;
};

export function InteriorSlot({ children, className }: InteriorSlotProps) {
	return <div className={cn(INTERIOR_SLOT_CLASS, className)}>{children}</div>;
}

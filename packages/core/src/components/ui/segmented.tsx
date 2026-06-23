import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '../../lib/utils';

/**
 * Segmented — a single-select control on Radix ToggleGroup, themed Brick & Ecru
 * (sunken track, a raised pill on the active segment). Compose with `SegmentedItem`.
 *
 * Unlike a bare ToggleGroup it never deselects: clicking the active segment is a
 * no-op, so a value is always set — the right contract for a mode/format picker.
 */
export type SegmentedProps = {
	value: string;
	onValueChange: (value: string) => void;
	block?: boolean;
	disabled?: boolean;
	className?: string;
	children: ReactNode;
	'aria-label'?: string;
};

export function Segmented({
	value,
	onValueChange,
	block,
	disabled,
	className,
	children,
	...props
}: SegmentedProps) {
	return (
		<ToggleGroupPrimitive.Root
			type="single"
			value={value}
			disabled={disabled}
			onValueChange={(next) => {
				if (next) onValueChange(next);
			}}
			className={cn(
				'segmented inline-flex items-center gap-0.5 rounded-md bg-muted p-0.5',
				block && 'flex w-full',
				className,
			)}
			{...props}
		>
			{children}
		</ToggleGroupPrimitive.Root>
	);
}

export function SegmentedItem({
	className,
	block,
	...props
}: ComponentProps<typeof ToggleGroupPrimitive.Item> & { block?: boolean }) {
	return (
		<ToggleGroupPrimitive.Item
			className={cn(
				'segmented-item inline-flex min-w-0 items-center justify-center gap-1.5 rounded-[6px] px-2.5 py-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm disabled:pointer-events-none disabled:opacity-50',
				block && 'flex-1',
				className,
			)}
			{...props}
		/>
	);
}

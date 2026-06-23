import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import type { ComponentProps } from 'react';
import { cn } from '../../lib/utils';
import { buttonVariants } from './button';

/**
 * AlertDialog — shadcn/ui on Radix, themed Brick & Ecru. For destructive or
 * irreversible confirmations (the focus traps to Cancel; there is no dismiss-X).
 */
export const AlertDialog = AlertDialogPrimitive.Root;
export const AlertDialogTrigger = AlertDialogPrimitive.Trigger;

export function AlertDialogOverlay({
	className,
	...props
}: ComponentProps<typeof AlertDialogPrimitive.Overlay>) {
	return (
		<AlertDialogPrimitive.Overlay
			className={cn(
				'fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px]',
				className,
			)}
			{...props}
		/>
	);
}

export function AlertDialogContent({
	className,
	...props
}: ComponentProps<typeof AlertDialogPrimitive.Content>) {
	return (
		<AlertDialogPrimitive.Portal>
			<AlertDialogOverlay />
			<AlertDialogPrimitive.Content
				className={cn(
					'fixed left-1/2 top-1/2 z-50 grid w-full max-w-md -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl border border-border bg-card p-6 text-card-foreground shadow-lg focus:outline-none',
					className,
				)}
				{...props}
			/>
		</AlertDialogPrimitive.Portal>
	);
}

export function AlertDialogHeader({
	className,
	...props
}: ComponentProps<'div'>) {
	return (
		<div
			className={cn('flex flex-col gap-1.5 text-left', className)}
			{...props}
		/>
	);
}

export function AlertDialogFooter({
	className,
	...props
}: ComponentProps<'div'>) {
	return (
		<div
			className={cn(
				'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
				className,
			)}
			{...props}
		/>
	);
}

export function AlertDialogTitle({
	className,
	...props
}: ComponentProps<typeof AlertDialogPrimitive.Title>) {
	return (
		<AlertDialogPrimitive.Title
			className={cn('text-lg font-semibold leading-none', className)}
			{...props}
		/>
	);
}

export function AlertDialogDescription({
	className,
	...props
}: ComponentProps<typeof AlertDialogPrimitive.Description>) {
	return (
		<AlertDialogPrimitive.Description
			className={cn('text-sm text-muted-foreground', className)}
			{...props}
		/>
	);
}

export function AlertDialogAction({
	className,
	...props
}: ComponentProps<typeof AlertDialogPrimitive.Action>) {
	return (
		<AlertDialogPrimitive.Action
			className={cn(buttonVariants(), className)}
			{...props}
		/>
	);
}

export function AlertDialogCancel({
	className,
	...props
}: ComponentProps<typeof AlertDialogPrimitive.Cancel>) {
	return (
		<AlertDialogPrimitive.Cancel
			className={cn(buttonVariants({ variant: 'outline' }), className)}
			{...props}
		/>
	);
}

import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { cn } from '../../lib/utils';

/** Alert — shadcn/ui inline notice, themed Brick & Ecru. `banner` drops the radius for a full-bleed strip. */
const alertVariants = cva(
	'flex items-center gap-3 border px-4 py-3 text-sm [&_svg]:size-4 [&_svg]:shrink-0',
	{
		variants: {
			variant: {
				default: 'rounded-lg border-border bg-card text-card-foreground',
				info: 'rounded-lg border-border bg-secondary text-foreground',
				destructive:
					'rounded-lg border-destructive/40 bg-destructive/5 text-destructive',
			},
			banner: { true: 'rounded-none border-x-0 border-t-0' },
		},
		defaultVariants: { variant: 'default' },
	},
);

export type AlertProps = ComponentProps<'div'> &
	VariantProps<typeof alertVariants>;

export function Alert({
	className,
	variant,
	banner,
	role = 'status',
	...props
}: AlertProps) {
	return (
		<div
			role={role}
			className={cn(alertVariants({ variant, banner }), className)}
			{...props}
		/>
	);
}

export function AlertTitle({ className, ...props }: ComponentProps<'div'>) {
	return (
		<div className={cn('font-medium leading-snug', className)} {...props} />
	);
}

export function AlertDescription({
	className,
	...props
}: ComponentProps<'div'>) {
	return (
		<div
			className={cn('text-sm leading-snug text-muted-foreground', className)}
			{...props}
		/>
	);
}

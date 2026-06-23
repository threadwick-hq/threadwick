import { Slot } from '@radix-ui/react-slot';
import { Icon } from '@threadwick/icons';
import type { ComponentProps } from 'react';
import { cn } from '../../lib/utils';

/** Breadcrumb — shadcn/ui location trail (not a back button), themed Brick & Ecru. */
export function Breadcrumb(props: ComponentProps<'nav'>) {
	return <nav aria-label="Breadcrumb" {...props} />;
}

export function BreadcrumbList({ className, ...props }: ComponentProps<'ol'>) {
	return (
		<ol
			className={cn(
				'flex flex-nowrap items-center gap-1.5 break-words text-sm text-muted-foreground',
				className,
			)}
			{...props}
		/>
	);
}

export function BreadcrumbItem({ className, ...props }: ComponentProps<'li'>) {
	return (
		<li
			className={cn('inline-flex min-w-0 items-center gap-1.5', className)}
			{...props}
		/>
	);
}

export function BreadcrumbLink({
	className,
	asChild,
	...props
}: ComponentProps<'a'> & { asChild?: boolean }) {
	const Comp = asChild ? Slot : 'a';
	return (
		<Comp
			className={cn('transition-colors hover:text-foreground', className)}
			{...props}
		/>
	);
}

export function BreadcrumbPage({
	className,
	...props
}: ComponentProps<'span'>) {
	return (
		<span
			aria-current="page"
			className={cn('text-foreground', className)}
			{...props}
		/>
	);
}

export function BreadcrumbSeparator({
	className,
	children,
	...props
}: ComponentProps<'li'>) {
	return (
		<li
			role="presentation"
			aria-hidden="true"
			className={cn('[&_svg]:size-3.5', className)}
			{...props}
		>
			{children ?? <Icon name="next" label="" />}
		</li>
	);
}

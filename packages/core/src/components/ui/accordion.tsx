import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { Icon } from '@threadwick/icons';
import type { ComponentProps } from 'react';
import { cn } from '../../lib/utils';

/** Accordion — shadcn/ui on Radix, themed Brick & Ecru; chevron from @threadwick/icons. */
export function Accordion(
	props: ComponentProps<typeof AccordionPrimitive.Root>,
) {
	return <AccordionPrimitive.Root {...props} />;
}

export function AccordionItem({
	className,
	...props
}: ComponentProps<typeof AccordionPrimitive.Item>) {
	return (
		<AccordionPrimitive.Item
			className={cn('border-b border-border', className)}
			{...props}
		/>
	);
}

export function AccordionTrigger({
	className,
	children,
	...props
}: ComponentProps<typeof AccordionPrimitive.Trigger>) {
	return (
		<AccordionPrimitive.Header className="flex">
			<AccordionPrimitive.Trigger
				className={cn(
					'flex flex-1 items-center justify-between gap-4 py-4 text-left text-base font-medium text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&[data-state=open]>svg]:rotate-180',
					className,
				)}
				{...props}
			>
				{children}
				<Icon
					name="expand"
					label=""
					className="shrink-0 text-muted-foreground transition-transform duration-200"
				/>
			</AccordionPrimitive.Trigger>
		</AccordionPrimitive.Header>
	);
}

export function AccordionContent({
	className,
	children,
	...props
}: ComponentProps<typeof AccordionPrimitive.Content>) {
	return (
		<AccordionPrimitive.Content className="overflow-hidden text-sm" {...props}>
			<div
				className={cn('pb-4 leading-relaxed text-muted-foreground', className)}
			>
				{children}
			</div>
		</AccordionPrimitive.Content>
	);
}

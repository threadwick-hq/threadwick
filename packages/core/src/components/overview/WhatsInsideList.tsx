import { Icon, type IconName } from '@threadwick/icons';
import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export type WhatsInsideRow = {
	id: string;
	icon: IconName;
	title: string;
	subtitle: string;
	href: string;
};

export type WhatsInsideListProps = {
	items: WhatsInsideRow[];
	linkComponent: (props: {
		to: string;
		className?: string;
		children: ReactNode;
	}) => ReactNode;
	/** When true, rows are static previews without navigation affordances (§4.4). */
	readOnly?: boolean;
	className?: string;
};

/** Navigable "what's inside" rows for pattern overview (§4.2). */
export function WhatsInsideList({
	items,
	linkComponent,
	readOnly = false,
	className,
}: WhatsInsideListProps) {
	if (items.length === 0) return null;
	const rowClassName =
		'flex items-center gap-3 rounded-md border border-border px-3 py-2.5 transition-colors';
	return (
		<section className={cn('max-w-xl', className)}>
			<h2 className="mb-2 text-[11px] uppercase tracking-wide text-muted-foreground">
				What&apos;s inside
			</h2>
			<ul className="space-y-2">
				{items.map((item) => (
					<li key={item.id}>
						{readOnly ? (
							<div className={rowClassName}>
								<Icon
									name={item.icon}
									label=""
									className="size-[18px] shrink-0 text-muted-foreground"
								/>
								<span className="min-w-0 flex-1">
									<span className="block text-[13px] font-medium">
										{item.title}
									</span>
									<span className="block text-[11.5px] text-muted-foreground">
										{item.subtitle}
									</span>
								</span>
							</div>
						) : (
							linkComponent({
								to: item.href,
								className: cn(rowClassName, 'hover:bg-muted/50'),
								children: (
									<>
										<Icon
											name={item.icon}
											label=""
											className="size-[18px] shrink-0 text-muted-foreground"
										/>
										<span className="min-w-0 flex-1">
											<span className="block text-[13px] font-medium">
												{item.title}
											</span>
											<span className="block text-[11.5px] text-muted-foreground">
												{item.subtitle}
											</span>
										</span>
										<Icon
											name="next"
											label=""
											className="size-4 shrink-0 text-muted-foreground"
										/>
									</>
								),
							})
						)}
					</li>
				))}
			</ul>
		</section>
	);
}

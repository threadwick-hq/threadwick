import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/badge';

export type ProjectOverviewHeaderProps = {
	title: string;
	statusLabel: string;
	statusDotClassName: string;
	subtitle?: ReactNode;
	className?: string;
};

/** Overview title row — name + state pill (§5). */
export function ProjectOverviewHeader({
	title,
	statusLabel,
	statusDotClassName,
	subtitle,
	className,
}: ProjectOverviewHeaderProps) {
	return (
		<header className={cn('space-y-1', className)}>
			<div className="flex flex-wrap items-center gap-3">
				<h1 className="text-2xl font-medium tracking-tight">{title}</h1>
				<Badge
					variant="secondary"
					className="h-6 gap-1.5 border-transparent px-2.5 py-0 text-[10.5px] font-normal"
				>
					<span
						className={cn('size-1.5 shrink-0 rounded-full', statusDotClassName)}
						aria-hidden
					/>
					{statusLabel}
				</Badge>
			</div>
			{subtitle ? (
				<p className="max-w-prose text-sm text-muted-foreground">{subtitle}</p>
			) : null}
		</header>
	);
}

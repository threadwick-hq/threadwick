import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/badge';

export type PatternOverviewHeaderProps = {
	title: string;
	statusLabel: string;
	className?: string;
	trailing?: ReactNode;
};

/** Pattern overview title row — name + state pill (§4.2). */
export function PatternOverviewHeader({
	title,
	statusLabel,
	className,
	trailing,
}: PatternOverviewHeaderProps) {
	return (
		<header className={cn('space-y-1', className)}>
			<div className="flex flex-wrap items-center gap-3">
				<h1 className="text-2xl font-medium tracking-tight">{title}</h1>
				<Badge
					variant="secondary"
					className="h-6 gap-1.5 border-transparent px-2.5 py-0 text-[10.5px] font-normal"
				>
					<span
						className="size-1.5 shrink-0 rounded-full bg-emerald-500"
						aria-hidden
					/>
					{statusLabel}
				</Badge>
				{trailing}
			</div>
		</header>
	);
}

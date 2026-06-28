import { Icon } from '@threadwick/icons';
import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

export type InteriorIdentityTileProps = {
	title: string;
	statusLabel: string;
	/** Tailwind background class for the quiet status dot (§5). */
	statusDotClassName: string;
	onSettingsClick?: () => void;
	settingsLabel?: string;
	leading?: ReactNode;
	className?: string;
};

/** Object identity tile — occupies the craft-picker slot 1:1 with no layout shift (§4.1, §5). */
export function InteriorIdentityTile({
	title,
	statusLabel,
	statusDotClassName,
	onSettingsClick,
	settingsLabel = 'Project settings',
	leading,
	className,
}: InteriorIdentityTileProps) {
	return (
		<div
			className={cn(
				'flex w-full min-w-0 items-center gap-2 rounded-md border border-border px-2 py-1.5',
				className,
			)}
		>
			{leading ?? (
				<span
					className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground [&_svg]:size-4"
					aria-hidden
				>
					<Icon name="projects" label="" />
				</span>
			)}
			<span className="min-w-0 flex-1">
				<span className="block truncate text-[13px] font-medium leading-tight">
					{title}
				</span>
				<Badge
					variant="secondary"
					className="mt-0.5 h-5 gap-1 border-transparent px-1.5 py-0 text-[10.5px] font-normal"
				>
					<span
						className={cn('size-1.5 shrink-0 rounded-full', statusDotClassName)}
						aria-hidden
					/>
					{statusLabel}
				</Badge>
			</span>
			<Button
				type="button"
				variant="ghost"
				size="icon"
				className="size-7 shrink-0 text-muted-foreground"
				onClick={onSettingsClick}
				disabled={!onSettingsClick}
				aria-label={settingsLabel}
			>
				<Icon name="settings" label="" className="size-4" />
			</Button>
		</div>
	);
}

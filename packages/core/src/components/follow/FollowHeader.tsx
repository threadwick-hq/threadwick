import { Icon } from '@threadwick/icons';
import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { Switch } from '../ui/switch';

export type FollowHeaderProps = {
	title: string;
	subtitle: string;
	backSlot: ReactNode;
	keepAwake?: boolean;
	onKeepAwakeChange?: (enabled: boolean) => void;
	keepAwakeSupported?: boolean;
	className?: string;
};

/** Slim focus bar: back · pattern name · keep-awake · overflow (§6). */
export function FollowHeader({
	title,
	subtitle,
	backSlot,
	keepAwake,
	onKeepAwakeChange,
	keepAwakeSupported,
	className,
}: FollowHeaderProps) {
	return (
		<header
			className={cn(
				'flex shrink-0 items-center gap-2.5 border-b border-border bg-background px-4 py-3 md:px-5 md:py-3.5',
				className,
			)}
		>
			{backSlot}
			<div className="min-w-0 flex-1">
				<p className="truncate text-sm font-medium md:text-[15px]">{title}</p>
				<p className="text-xs text-muted-foreground md:text-[12.5px]">
					{subtitle}
				</p>
			</div>
			{keepAwakeSupported && onKeepAwakeChange ? (
				<label className="flex shrink-0 items-center gap-1.5">
					<Switch
						checked={keepAwake}
						onCheckedChange={onKeepAwakeChange}
						aria-label="Keep screen awake"
					/>
					<span className="hidden text-xs text-muted-foreground sm:inline">
						Awake
					</span>
				</label>
			) : null}
			<button
				type="button"
				className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground md:size-8"
				aria-label="More options"
			>
				<Icon name="more" label="" className="size-4" />
			</button>
		</header>
	);
}

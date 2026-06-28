import { Icon } from '@threadwick/icons';
import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '../ui/dropdown-menu';

export type VersionOption = {
	id: string;
	label: string;
	status: string;
};

export type PinnedVersionTileProps = {
	versionLabel: string;
	versionStatus?: string;
	versions?: VersionOption[];
	activeVersionId?: string;
	onVersionChange?: (versionId: string) => void;
	primaryAction?: ReactNode;
	secondaryAction?: ReactNode;
	/** When false, hide the publish/remix action row (view-mode version switcher only). */
	showActions?: boolean;
	className?: string;
};

function VersionSwitcher({
	versionLabel,
	versionStatus,
	versions,
	activeVersionId,
	onVersionChange,
}: Pick<
	PinnedVersionTileProps,
	'versionLabel' | 'versionStatus' | 'versions' | 'activeVersionId' | 'onVersionChange'
>) {
	const canSwitch = versions && versions.length > 1 && onVersionChange;

	if (!canSwitch) {
		return (
			<>
				<Icon name="draft" label="" className="size-4 shrink-0 text-muted-foreground" />
				<span className="min-w-0 flex-1 truncate text-[12.5px] font-medium">
					{versionLabel}
					{versionStatus ? (
						<span className="font-normal text-muted-foreground"> · {versionStatus}</span>
					) : null}
				</span>
				<Icon name="chevron-down" label="" className="size-3.5 shrink-0 text-muted-foreground" />
			</>
		);
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					type="button"
					className="flex min-w-0 flex-1 items-center gap-2 rounded-sm text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
					aria-label="Switch version"
				>
					<Icon name="draft" label="" className="size-4 shrink-0 text-muted-foreground" />
					<span className="min-w-0 flex-1 truncate text-[12.5px] font-medium">
						{versionLabel}
						{versionStatus ? (
							<span className="font-normal text-muted-foreground"> · {versionStatus}</span>
						) : null}
					</span>
					<Icon name="chevron-down" label="" className="size-3.5 shrink-0 text-muted-foreground" />
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="min-w-[12rem]">
				{versions.map((version) => (
					<DropdownMenuItem
						key={version.id}
						onSelect={() => onVersionChange(version.id)}
						className={cn(
							'text-[12.5px]',
							version.id === activeVersionId && 'bg-accent',
						)}
					>
						<span className="min-w-0 flex-1 truncate">
							{version.label}
							<span className="text-muted-foreground"> · {version.status}</span>
						</span>
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

/** Pinned bottom-of-rail version tile (§4.1): switcher + publish + Remix. */
export function PinnedVersionTile({
	versionLabel,
	versionStatus,
	versions,
	activeVersionId,
	onVersionChange,
	primaryAction,
	secondaryAction,
	showActions = true,
	className,
}: PinnedVersionTileProps) {
	return (
		<div className={cn('rounded-md border border-border p-2.5', className)}>
			<div className="flex items-center gap-2">
				<VersionSwitcher
					versionLabel={versionLabel}
					versionStatus={versionStatus}
					versions={versions}
					activeVersionId={activeVersionId}
					onVersionChange={onVersionChange}
				/>
			</div>
			{showActions ? (
				<div className="mt-2 flex gap-2">
					{primaryAction ?? (
						<Button type="button" className="h-8 flex-1 text-[11.5px]" disabled>
							Publish version
						</Button>
					)}
					{secondaryAction ?? (
						<Button type="button" variant="outline" className="h-8 px-3 text-[11.5px]" disabled>
							Remix
						</Button>
					)}
				</div>
			) : null}
		</div>
	);
}

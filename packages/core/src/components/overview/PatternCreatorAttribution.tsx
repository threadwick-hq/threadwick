import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

export type PatternCreatorAttributionProps = {
	name: string;
	handle?: string;
	followerCount?: number;
	onFollow?: () => void;
	className?: string;
};

/** View-mode creator row — full name primary, @handle secondary (§4.4). */
export function PatternCreatorAttribution({
	name,
	handle,
	followerCount,
	onFollow,
	className,
}: PatternCreatorAttributionProps) {
	return (
		<div className={cn('flex flex-wrap items-center gap-x-3 gap-y-1', className)}>
			<div className="min-w-0">
				<p className="text-[13px] font-medium">{name}</p>
				{handle ? (
					<p className="text-[12px] text-muted-foreground">{handle}</p>
				) : null}
			</div>
			{followerCount != null ? (
				<p className="text-[11.5px] text-muted-foreground">
					{followerCount.toLocaleString()} followers
				</p>
			) : null}
			{onFollow ? (
				<Button
					type="button"
					variant="outline"
					size="sm"
					className="h-7 px-3 text-[11.5px]"
					onClick={onFollow}
				>
					Follow
				</Button>
			) : null}
		</div>
	);
}

import type { ComponentProps, ReactNode } from 'react';
import { cn } from '../../lib/utils';

type PhotoCardProps = {
	title: string;
	/** Muted meta line under the title, e.g. a plain-language state. */
	subtitle?: string;
	/** Photo URL — patterns and projects are represented by photos, never chart snapshots. */
	photoUrl?: string;
	/** Required alongside photoUrl; empty string marks a decorative photo. */
	photoAlt?: string;
	/** Overlaid on the media area's top-left corner (e.g. a status chip — text, never colour-only). */
	badge?: ReactNode;
	/** Extra row under the title/subtitle (e.g. progress, counts). */
	footer?: ReactNode;
} & ComponentProps<'div'>;

/**
 * PhotoCard — the photo-first content tile (spec §0 locked visuals): white
 * tile + hairline border; the gray fill appears only as the image placeholder.
 * Presentational and router-agnostic — wrap it in a Link for navigation.
 */
export function PhotoCard({
	title,
	subtitle,
	photoUrl,
	photoAlt,
	badge,
	footer,
	className,
	...props
}: PhotoCardProps) {
	return (
		<div
			className={cn(
				'overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md',
				className,
			)}
			{...props}
		>
			<div className="relative aspect-[4/3] w-full">
				{photoUrl ? (
					<img
						src={photoUrl}
						alt={photoAlt ?? ''}
						loading="lazy"
						className="absolute inset-0 h-full w-full object-cover"
					/>
				) : (
					// Gray fill is reserved for exactly this: "image goes here".
					<div aria-hidden="true" className="absolute inset-0 bg-muted" />
				)}
				{badge ? <div className="absolute left-2 top-2">{badge}</div> : null}
			</div>
			<div className="flex flex-col gap-0.5 p-3">
				<div className="truncate text-sm font-medium">{title}</div>
				{subtitle ? (
					<div className="truncate text-xs text-muted-foreground">
						{subtitle}
					</div>
				) : null}
				{footer}
			</div>
		</div>
	);
}

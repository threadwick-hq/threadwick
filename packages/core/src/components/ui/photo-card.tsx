import type { ComponentProps, ReactNode } from 'react';
import { cn } from '../../lib/utils';

// A photo requires alt text at the type level (machine-enforced a11y):
// pass photoAlt='' only for a genuinely decorative photo.
export type PhotoCardMedia =
	| { photoUrl: string; photoAlt: string }
	| { photoUrl?: undefined; photoAlt?: undefined };

type PhotoCardProps = {
	title: string;
	/** Muted meta line under the title, e.g. a plain-language state. */
	subtitle?: string;
	/**
	 * Rendered inside a white chip over the media area's top-left corner, so
	 * text keeps AA contrast on any photo. Keep it text, never colour-only.
	 */
	badge?: ReactNode;
	/** Extra row under the title/subtitle (e.g. progress, counts). */
	footer?: ReactNode;
} & PhotoCardMedia &
	ComponentProps<'div'>;

/**
 * PhotoCard — the photo-first content tile (spec §0 locked visuals): white
 * tile + hairline border; the gray fill appears only as the image placeholder.
 * By convention the media slot carries a photo, never a chart snapshot.
 * Presentational and router-agnostic — wrap it in a Link for navigation, and
 * give that link an explicit aria-label (the card subtree makes a noisy name).
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
				{photoUrl !== undefined ? (
					<img
						src={photoUrl}
						alt={photoAlt}
						loading="lazy"
						className="absolute inset-0 h-full w-full object-cover"
					/>
				) : (
					// Gray fill is reserved for exactly this: "image goes here".
					<div aria-hidden="true" className="absolute inset-0 bg-muted" />
				)}
				{badge ? (
					<div className="absolute left-2 top-2 rounded-full bg-card px-2 py-0.5 text-xs font-medium shadow-sm">
						{badge}
					</div>
				) : null}
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

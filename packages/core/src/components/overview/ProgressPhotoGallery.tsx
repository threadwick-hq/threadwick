import { Icon } from '@threadwick/icons';
import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export type ProgressPhotoItem = {
	id: string;
	src?: string;
	alt?: string;
};

export type ProgressPhotoGalleryProps = {
	photos: ProgressPhotoItem[];
	addPhotoAction?: ReactNode;
	className?: string;
};

/** Progress-photo strip for the project overview (§5). */
export function ProgressPhotoGallery({
	photos,
	addPhotoAction,
	className,
}: ProgressPhotoGalleryProps) {
	return (
		<div className={cn('flex flex-wrap items-start gap-2', className)}>
			{photos.map((photo) => (
				<div
					key={photo.id}
					className="flex size-[7.5rem] shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted text-muted-foreground"
				>
					{photo.src ? (
						<img
							src={photo.src}
							alt={photo.alt ?? 'Progress photo'}
							className="size-full object-cover"
						/>
					) : (
						<Icon name="preview" label="" className="size-7 opacity-60" aria-hidden />
					)}
				</div>
			))}
			{photos.length === 0 ? (
				<div className="flex size-[7.5rem] shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
					<Icon name="preview" label="" className="size-7 opacity-60" aria-hidden />
				</div>
			) : null}
			{addPhotoAction}
		</div>
	);
}

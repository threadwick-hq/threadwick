import { cn } from '../../lib/utils';

export type PatternViewRatingProps = {
	rating: number;
	reviewCount: number;
	reviewsHref?: string;
	className?: string;
};

/** View-mode rating pill linking to the reviews section (§4.4). */
export function PatternViewRating({
	rating,
	reviewCount,
	reviewsHref = '#reviews',
	className,
}: PatternViewRatingProps) {
	return (
		<a
			href={reviewsHref}
			className={cn(
				'inline-flex items-center gap-1 text-[12.5px] text-muted-foreground hover:text-foreground',
				className,
			)}
		>
			<span className="text-primary" aria-hidden>
				★
			</span>
			<span className="font-medium text-foreground">{rating.toFixed(1)}</span>
			<span>· {reviewCount.toLocaleString()} reviews</span>
		</a>
	);
}

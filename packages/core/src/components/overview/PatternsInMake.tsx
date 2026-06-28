import { Icon } from '@threadwick/icons';
import type { ComponentType, ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';

export type PatternInMakeItem = {
	id: string;
	label: string;
	sourceLabel: string;
	percent: number;
	progressLabel?: string;
	followHref: string;
};

export type PatternsInMakeProps = {
	patterns: PatternInMakeItem[];
	continueHref?: string;
	continueAction?: ReactNode;
	linkComponent?: ComponentType<{
		to: string;
		className?: string;
		children: ReactNode;
	}>;
	className?: string;
};

function DefaultLink({
	to,
	className,
	children,
}: {
	to: string;
	className?: string;
	children: ReactNode;
}) {
	return (
		<a href={to} className={className}>
			{children}
		</a>
	);
}

/** Patterns in this make — per-pattern progress + Continue/Open (§5). */
export function PatternsInMake({
	patterns,
	continueHref,
	continueAction,
	linkComponent: Link = DefaultLink,
	className,
}: PatternsInMakeProps) {
	if (patterns.length === 0) {
		return (
			<p className={cn('text-sm text-muted-foreground', className)}>
				No patterns in this make yet.
			</p>
		);
	}

	return (
		<div className={cn('space-y-3', className)}>
			{patterns.map((pattern) => (
				<article
					key={pattern.id}
					className="rounded-md border border-border bg-card p-3"
				>
					<div className="flex flex-wrap items-start justify-between gap-2">
						<div className="min-w-0">
							<h3 className="text-sm font-medium">{pattern.label}</h3>
							<p className="text-xs text-muted-foreground">
								{pattern.sourceLabel}
							</p>
						</div>
						<Link
							to={pattern.followHref}
							className="inline-flex items-center gap-1 text-xs text-primary underline-offset-4 hover:underline"
						>
							Open
							<Icon
								name="open-external"
								label=""
								className="size-3.5"
								aria-hidden
							/>
						</Link>
					</div>
					<div className="mt-2.5">
						<div className="mb-1 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
							<span>{pattern.progressLabel ?? 'Progress'}</span>
							<span className="tabular-nums">{pattern.percent}%</span>
						</div>
						<div
							className="h-1.5 overflow-hidden rounded-full bg-muted"
							role="progressbar"
							aria-valuenow={pattern.percent}
							aria-valuemin={0}
							aria-valuemax={100}
							aria-label={`${pattern.label} progress`}
						>
							<div
								className="h-full rounded-full bg-primary transition-[width] duration-200"
								style={{ width: `${pattern.percent}%` }}
							/>
						</div>
					</div>
					{continueHref === pattern.followHref ? (
						<div className="mt-3">
							{continueAction ?? (
								<Link to={pattern.followHref} className="inline-flex">
									<Button type="button" size="sm" className="h-9 gap-1.5">
										<Icon
											name="confirm"
											label=""
											className="size-4"
											aria-hidden
										/>
										Continue making
									</Button>
								</Link>
							)}
						</div>
					) : null}
				</article>
			))}
		</div>
	);
}

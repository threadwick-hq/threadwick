import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export type FollowShellProps = {
	header: ReactNode;
	modeSelector?: ReactNode;
	chart: ReactNode;
	pills?: ReactNode;
	instructions: ReactNode;
	footer: ReactNode;
	className?: string;
};

const splitLayout =
	'[@media(min-width:768px)_and_(orientation:landscape)]:flex-row [@media(min-width:768px)_and_(orientation:landscape)]:items-stretch lg:flex-row lg:items-stretch';

const splitChartColumn =
	'[@media(min-width:768px)_and_(orientation:landscape)]:flex-[1.1] [@media(min-width:768px)_and_(orientation:landscape)]:min-h-[300px] [@media(min-width:768px)_and_(orientation:landscape)]:border-r [@media(min-width:768px)_and_(orientation:landscape)]:border-border lg:flex-[1.1] lg:min-h-[300px] lg:border-r lg:border-border';

const splitControlsColumn =
	'[@media(min-width:768px)_and_(orientation:landscape)]:flex [@media(min-width:768px)_and_(orientation:landscape)]:min-h-0 [@media(min-width:768px)_and_(orientation:landscape)]:flex-1 [@media(min-width:768px)_and_(orientation:landscape)]:flex-col [@media(min-width:768px)_and_(orientation:landscape)]:px-5 [@media(min-width:768px)_and_(orientation:landscape)]:py-4 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col lg:px-5 lg:py-4';

/**
 * Responsive Follow shell — stacked on phone/tablet-portrait; side-by-side on
 * tablet-landscape/desktop; stage caps ~1040px and centers on ultra-wide (§6).
 */
export function FollowShell({
	header,
	modeSelector,
	chart,
	pills,
	instructions,
	footer,
	className,
}: FollowShellProps) {
	return (
		<div
			className={cn(
				'flex min-h-dvh w-full flex-col bg-background md:bg-muted/30',
				className,
			)}
		>
			{header}
			<div className="flex flex-1 flex-col px-4 py-4 md:px-6 md:py-6 lg:px-8">
				<div className="mx-auto flex w-full max-w-[380px] flex-1 flex-col overflow-hidden rounded-none bg-background md:max-w-[600px] md:rounded-[22px] md:border md:border-border lg:max-w-[1040px] lg:rounded-lg">
					{modeSelector ? (
						<div
							className={cn(
								'shrink-0 px-4 pb-3 pt-3 md:px-5 md:pt-4',
								'[@media(min-width:768px)_and_(orientation:landscape)]:hidden lg:hidden',
							)}
						>
							{modeSelector}
						</div>
					) : null}

					<div className={cn('flex min-h-0 flex-1 flex-col', splitLayout)}>
						<div
							className={cn(
								'shrink-0 px-4 pb-3 md:px-5 md:pb-4',
								splitChartColumn,
								'[@media(min-width:768px)_and_(orientation:landscape)]:flex [@media(min-width:768px)_and_(orientation:landscape)]:flex-col [@media(min-width:768px)_and_(orientation:landscape)]:justify-center [@media(min-width:768px)_and_(orientation:landscape)]:bg-muted/40 [@media(min-width:768px)_and_(orientation:landscape)]:px-0 [@media(min-width:768px)_and_(orientation:landscape)]:pb-0 lg:flex lg:flex-col lg:justify-center lg:bg-muted/40 lg:px-0 lg:pb-0',
							)}
						>
							<div
								className={cn(
									'[@media(min-width:768px)_and_(orientation:landscape)]:px-4 [@media(min-width:768px)_and_(orientation:landscape)]:py-4 lg:px-4 lg:py-4',
									'[@media(min-width:768px)_and_(orientation:landscape)]:flex-1 lg:flex-1',
								)}
							>
								{chart}
							</div>
						</div>

						<div className={splitControlsColumn}>
							{modeSelector ? (
								<div className="mb-3 hidden [@media(min-width:768px)_and_(orientation:landscape)]:block lg:block">
									{modeSelector}
								</div>
							) : null}
							{pills ? (
								<div className="mb-3 shrink-0 px-4 md:px-0">{pills}</div>
							) : null}
							<div className="min-h-0 flex-1 px-4 md:px-0">{instructions}</div>
							<div className="shrink-0">{footer}</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

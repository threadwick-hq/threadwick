import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from '../ui/breadcrumb';

export type InteriorBreadcrumbCrumb = {
	label: string;
	href?: string;
};

export type InteriorBreadcrumbProps = {
	crumbs: InteriorBreadcrumbCrumb[];
	className?: string;
	leading?: ReactNode;
};

/** Location trail beneath the identity tile — reflects the entry path (TW-025). */
export function InteriorBreadcrumb({ crumbs, className, leading }: InteriorBreadcrumbProps) {
	return (
		<Breadcrumb className={cn('px-2 pb-1 pt-0.5', className)}>
			<BreadcrumbList className="text-[11px]">
				{leading ? <BreadcrumbItem>{leading}</BreadcrumbItem> : null}
				{crumbs.map((crumb, index) => {
					const isLast = index === crumbs.length - 1;
					return (
						<InteriorBreadcrumbSegment
							key={`${crumb.label}-${index}`}
							crumb={crumb}
							isLast={isLast}
							showSeparator={index > 0 || !!leading}
						/>
					);
				})}
			</BreadcrumbList>
		</Breadcrumb>
	);
}

function InteriorBreadcrumbSegment({
	crumb,
	isLast,
	showSeparator,
}: {
	crumb: InteriorBreadcrumbCrumb;
	isLast: boolean;
	showSeparator: boolean;
}) {
	return (
		<>
			{showSeparator ? <BreadcrumbSeparator /> : null}
			<BreadcrumbItem className="min-w-0">
				{isLast || !crumb.href ? (
					<BreadcrumbPage className="truncate">{crumb.label}</BreadcrumbPage>
				) : (
					<BreadcrumbLink href={crumb.href} className="truncate">
						{crumb.label}
					</BreadcrumbLink>
				)}
			</BreadcrumbItem>
		</>
	);
}

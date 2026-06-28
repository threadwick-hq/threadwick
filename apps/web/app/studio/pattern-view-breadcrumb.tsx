import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from '@threadwick/core/components';
import { Icon } from '@threadwick/icons';
import { Link } from 'react-router';

export function PatternViewBreadcrumb({ patternName }: { patternName: string }) {
	return (
		<Breadcrumb className="px-2 pb-1 pt-0.5">
			<BreadcrumbList className="text-[11px]">
				<BreadcrumbItem>
					<Link
						to="/studio/marketplace/browse"
						className="inline-flex items-center text-muted-foreground hover:text-foreground [&_svg]:size-3.5"
						aria-label="Back to marketplace browse"
					>
						<Icon name="previous" label="" />
					</Link>
				</BreadcrumbItem>
				<BreadcrumbSeparator />
				<BreadcrumbItem className="min-w-0">
					<BreadcrumbLink asChild>
						<Link to="/studio/marketplace" className="truncate">
							Marketplace
						</Link>
					</BreadcrumbLink>
				</BreadcrumbItem>
				<BreadcrumbSeparator />
				<BreadcrumbItem className="min-w-0">
					<BreadcrumbLink asChild>
						<Link to="/studio/marketplace/browse" className="truncate">
							Browse
						</Link>
					</BreadcrumbLink>
				</BreadcrumbItem>
				<BreadcrumbSeparator />
				<BreadcrumbItem className="min-w-0">
					<BreadcrumbPage className="truncate">{patternName}</BreadcrumbPage>
				</BreadcrumbItem>
			</BreadcrumbList>
		</Breadcrumb>
	);
}

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

export function ProjectInteriorBreadcrumb({ projectName }: { projectName: string }) {
	return (
		<Breadcrumb className="px-2 pb-1 pt-0.5">
			<BreadcrumbList className="text-[11px]">
				<BreadcrumbItem>
					<Link
						to="/studio/projects"
						className="inline-flex items-center text-muted-foreground hover:text-foreground [&_svg]:size-3.5"
						aria-label="Back to projects"
					>
						<Icon name="previous" label="" />
					</Link>
				</BreadcrumbItem>
				<BreadcrumbSeparator />
				<BreadcrumbItem className="min-w-0">
					<BreadcrumbLink asChild>
						<Link to="/studio/patterns" className="truncate">
							Workbench
						</Link>
					</BreadcrumbLink>
				</BreadcrumbItem>
				<BreadcrumbSeparator />
				<BreadcrumbItem className="min-w-0">
					<BreadcrumbLink asChild>
						<Link to="/studio/projects" className="truncate">
							Projects
						</Link>
					</BreadcrumbLink>
				</BreadcrumbItem>
				<BreadcrumbSeparator />
				<BreadcrumbItem className="min-w-0">
					<BreadcrumbPage className="truncate">{projectName}</BreadcrumbPage>
				</BreadcrumbItem>
			</BreadcrumbList>
		</Breadcrumb>
	);
}

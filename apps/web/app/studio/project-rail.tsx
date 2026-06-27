import { cn } from '@threadwick/core/lib/utils';
import { Icon, type IconName } from '@threadwick/icons';
import { NavLink } from 'react-router';

export type ProjectRailLinkProps = {
	to: string;
	icon: IconName;
	label: string;
	end?: boolean;
	count?: number;
	meta?: string;
	className?: string;
};

export function ProjectRailLink({
	to,
	icon,
	label,
	end,
	count,
	meta,
	className,
}: ProjectRailLinkProps) {
	return (
		<NavLink
			to={to}
			end={end}
			className={({ isActive }) =>
				cn(
					'flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] transition-colors [&_svg]:size-4 [&_svg]:shrink-0',
					isActive
						? 'bg-accent font-medium text-accent-foreground'
						: 'text-muted-foreground hover:bg-muted hover:text-foreground',
					className,
				)
			}
		>
			<Icon name={icon} label="" />
			<span className="min-w-0 flex-1 truncate">{label}</span>
			{meta ? (
				<span className="max-w-[4.5rem] truncate text-[10px] text-muted-foreground/80">{meta}</span>
			) : null}
			{count !== undefined ? (
				<span className="text-[11px] tabular-nums text-muted-foreground/80">{count}%</span>
			) : null}
		</NavLink>
	);
}

export function ProjectRailSectionLabel({ children }: { children: React.ReactNode }) {
	return (
		<p className="px-2 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground/80">
			{children}
		</p>
	);
}

export function ProjectRailAddButton({ onClick }: { onClick?: () => void }) {
	return (
		<button
			type="button"
			className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground [&_svg]:size-4"
			onClick={onClick}
			disabled={!onClick}
		>
			<Icon name="add" label="" />
			<span>Add section</span>
		</button>
	);
}

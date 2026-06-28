import { Icon } from '@threadwick/icons';
import { cn } from '../../lib/utils';

export type MaterialChecklistItem = {
	id: string;
	label: string;
	fromStash?: boolean;
	acquired?: boolean;
};

export type MaterialsChecklistProps = {
	items: MaterialChecklistItem[];
	title?: string;
	className?: string;
};

function stashTag(
	fromStash: boolean | undefined,
	acquired: boolean | undefined,
): string {
	if (fromStash) return 'From stash';
	if (acquired === true) return 'In my stash';
	if (acquired === false) return 'Need to buy';
	return '';
}

/** Yarns & tools used with from-stash tags (§5 overview). */
export function MaterialsChecklist({
	items,
	title = 'Materials checklist',
	className,
}: MaterialsChecklistProps) {
	if (items.length === 0) return null;

	return (
		<section className={className}>
			<h2 className="mb-1 text-[11px] uppercase tracking-wide text-muted-foreground">
				{title}
			</h2>
			<ul className="max-w-xl divide-y divide-border rounded-md border border-border bg-card px-3">
				{items.map((item) => {
					const checked = item.acquired === true;
					const tag = stashTag(item.fromStash, item.acquired);
					return (
						<li
							key={item.id}
							className="flex items-center gap-2.5 py-2 text-[12.5px]"
						>
							<span
								className={cn(
									'flex size-4 shrink-0 items-center justify-center rounded border',
									checked
										? 'border-yarn-fern bg-yarn-fern text-primary-foreground'
										: 'border-border bg-background',
								)}
								aria-hidden
							>
								{checked ? (
									<Icon name="confirm" label="" className="size-2.5" />
								) : null}
							</span>
							<span className="min-w-0 flex-1">{item.label}</span>
							{tag ? (
								<span className="shrink-0 text-xs text-muted-foreground">
									{tag}
								</span>
							) : null}
						</li>
					);
				})}
			</ul>
		</section>
	);
}

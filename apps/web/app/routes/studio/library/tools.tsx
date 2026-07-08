import { cn } from '@threadwick/core/lib/utils';
import { type ToolKind, toolMatrixForCraft } from '@threadwick/types';
import { useCraftScope } from '../../../studio/craft-scope';
import { toggleTool, useOwnedTools } from '../../../studio/library-store';

const KIND_LABEL: Record<ToolKind, string> = {
	hook: 'Crochet hooks',
	needle: 'Knitting needles',
};

/** Library › Tools — the tap-to-own size matrix (spec §7). Owned cells fill terracotta. */
export default function LibraryTools() {
	const { scope } = useCraftScope();
	const owned = useOwnedTools();
	const sections = toolMatrixForCraft(scope);
	const isOwned = (kind: ToolKind, size: string) =>
		owned.some((t) => t.kind === kind && t.size === size);
	// Count only the kinds this scope shows, so the header matches the matrix.
	const scopedOwned = owned.filter((t) =>
		sections.some((s) => s.kind === t.kind),
	).length;

	return (
		<div className="mx-auto max-w-3xl px-6 py-8">
			<h1 className="text-2xl font-medium tracking-tight">Tools</h1>
			<p className="mt-1 text-sm text-muted-foreground">
				{scopedOwned} owned — tap a size to add or remove it. Your owned set
				powers the “owned only” filter in the project tool picker.
			</p>

			{sections.map((section) => (
				<section key={section.kind} className="mt-8">
					<h2 className="text-sm font-medium">{KIND_LABEL[section.kind]}</h2>
					<div className="mt-3 flex flex-wrap gap-2">
						{section.sizes.map((size) => {
							const active = isOwned(section.kind, size);
							return (
								<button
									key={size}
									type="button"
									aria-pressed={active}
									aria-label={`${size} ${section.kind}`}
									onClick={() => toggleTool(section.kind, size)}
									className={cn(
										'min-w-16 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
										active
											? 'border-primary bg-primary text-primary-foreground'
											: 'border-border bg-card text-foreground hover:bg-muted/50',
									)}
								>
									{size}
								</button>
							);
						})}
					</div>
				</section>
			))}
		</div>
	);
}

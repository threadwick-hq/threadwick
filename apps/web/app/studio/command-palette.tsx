import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from '@threadwick/core/components';
import { Icon } from '@threadwick/icons';
import { useEffect, useRef } from 'react';

export type CommandPaletteProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

/**
 * The Cmd+K search palette shell — a labelled dialog over the library and marketplace.
 * Chrome only for TW-022: no result population yet, so it always shows the empty state.
 * The input autofocuses whenever the dialog opens.
 */
export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (open) inputRef.current?.focus();
	}, [open]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-xl gap-0 p-0">
				<DialogTitle className="sr-only">Search</DialogTitle>
				<DialogDescription className="sr-only">
					Search your library and the marketplace.
				</DialogDescription>
				<div className="flex items-center gap-3 border-b border-border px-4 py-3">
					<Icon
						name="search"
						label=""
						className="size-4 shrink-0 text-muted-foreground"
					/>
					<input
						ref={inputRef}
						type="text"
						placeholder="Search your library and the marketplace"
						className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
					/>
				</div>
				<p className="px-4 py-6 text-center text-sm text-muted-foreground">
					Start typing. Results are coming soon.
				</p>
			</DialogContent>
		</Dialog>
	);
}

import { Icon } from '@threadwick/icons';
import { useId, useState } from 'react';
import { cn } from '../../lib/utils';

export type EditableDescriptionProps = {
	value: string;
	onChange: (value: string) => void;
	className?: string;
	placeholder?: string;
};

/** Inline-editable overview description with pencil affordance (§4.2). */
export function EditableDescription({
	value,
	onChange,
	className,
	placeholder = 'Add a description…',
}: EditableDescriptionProps) {
	const [editing, setEditing] = useState(false);
	const inputId = useId();

	if (editing) {
		return (
			<textarea
				id={inputId}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				onBlur={() => setEditing(false)}
				autoFocus
				rows={3}
				className={cn(
					'max-w-prose rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
					className,
				)}
				placeholder={placeholder}
				aria-label="Pattern description"
			/>
		);
	}

	return (
		<div className={cn('flex max-w-prose items-start gap-1.5', className)}>
			<p className="flex-1 text-sm leading-relaxed text-muted-foreground">
				{value || placeholder}
			</p>
			<button
				type="button"
				className="mt-0.5 shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
				onClick={() => setEditing(true)}
				aria-label="Edit description"
			>
				<Icon name="edit" label="" className="size-3.5" />
			</button>
		</div>
	);
}

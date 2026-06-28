import { useEffect, useId, useState } from 'react';
import { cn } from '../../lib/utils';

/**
 * NumberInput — a clamped numeric field with −/+ steppers, themed Brick & Ecru.
 * Replaces Ant Design's `InputNumber`: `onChange` only fires with a finite,
 * clamped number, so callers never have to guard `NaN` or `null`.
 *
 * The field holds a free-text buffer and clamps only on commit (blur / Enter / a
 * stepper press), so typing a value that is transiently below `min` — e.g. "5" on
 * the way to "50" — isn't snapped mid-keystroke. The buffer re-syncs whenever the
 * controlled `value` changes (which only happens on commit, never mid-typing).
 * Escape, or an unparseable entry on blur, reverts to the current value.
 */
export type NumberInputProps = {
	value: number | undefined;
	onChange: (value: number) => void;
	min?: number;
	max?: number;
	step?: number;
	disabled?: boolean;
	className?: string;
	label?: string;
};

export function NumberInput({
	value,
	onChange,
	min,
	max,
	step = 1,
	disabled,
	className,
	label,
}: NumberInputProps) {
	const inputId = useId();
	const [text, setText] = useState(() => fmt(value));

	// The controlled value only moves on commit (blur/Enter/stepper), so re-syncing the
	// buffer to it never clobbers an in-progress edit — it just reflects the committed result.
	useEffect(() => {
		setText(fmt(value));
	}, [value]);

	const clamp = (n: number) =>
		Math.min(
			max ?? Number.POSITIVE_INFINITY,
			Math.max(min ?? Number.NEGATIVE_INFINITY, n),
		);
	const base = parseNum(text) ?? value ?? 0;
	const atMin = min !== undefined && base <= min;
	const atMax = max !== undefined && base >= max;

	const bump = (delta: number) => onChange(clamp(base + delta));
	const commitText = () => {
		const n = parseNum(text);
		if (n === undefined) setText(fmt(value));
		else onChange(clamp(n));
	};

	return (
		<div
			className={cn(
				'inline-flex h-9 w-full items-center overflow-hidden rounded-md border border-input bg-background shadow-sm focus-within:ring-2 focus-within:ring-ring',
				disabled && 'cursor-not-allowed opacity-50',
				className,
			)}
		>
			<button
				type="button"
				aria-label="Decrease"
				disabled={disabled || atMin}
				onMouseDown={(e) => e.preventDefault()}
				onClick={() => bump(-step)}
				className="flex h-full w-8 shrink-0 items-center justify-center text-base text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
			>
				&minus;
			</button>
			<input
				id={inputId}
				type="number"
				inputMode="numeric"
				value={text}
				min={min}
				max={max}
				step={step}
				disabled={disabled}
				aria-label={label}
				onChange={(e) => setText(e.target.value)}
				onBlur={commitText}
				onKeyDown={(e) => {
					if (e.key === 'Enter') {
						commitText();
						e.currentTarget.blur();
					} else if (e.key === 'Escape') {
						setText(fmt(value));
						e.currentTarget.blur();
					}
				}}
				className="h-full w-full min-w-0 border-x border-input bg-transparent px-2 text-center text-sm tabular-nums focus:outline-none disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
			/>
			<button
				type="button"
				aria-label="Increase"
				disabled={disabled || atMax}
				onMouseDown={(e) => e.preventDefault()}
				onClick={() => bump(step)}
				className="flex h-full w-8 shrink-0 items-center justify-center text-base text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
			>
				+
			</button>
		</div>
	);
}

function fmt(value: number | undefined): string {
	return value === undefined ? '' : String(value);
}

function parseNum(text: string): number | undefined {
	const n = Number(text);
	return text.trim() !== '' && Number.isFinite(n) ? n : undefined;
}

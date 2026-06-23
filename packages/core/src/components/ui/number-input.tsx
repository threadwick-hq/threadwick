import { useId } from 'react';
import { cn } from '../../lib/utils';

/**
 * NumberInput — a clamped numeric field with −/+ steppers, themed Brick & Ecru.
 * Replaces Ant Design's `InputNumber`: `onChange` only fires with a finite,
 * clamped number, so callers never have to guard `NaN` or `null`.
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
	const clamp = (n: number) => {
		const lo = min ?? Number.NEGATIVE_INFINITY;
		const hi = max ?? Number.POSITIVE_INFINITY;
		return Math.min(hi, Math.max(lo, n));
	};
	const commit = (n: number) => {
		if (Number.isFinite(n)) onChange(clamp(n));
	};
	const current = value ?? 0;
	const atMin = min !== undefined && current <= min;
	const atMax = max !== undefined && current >= max;

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
				onClick={() => commit(current - step)}
				className="flex h-full w-8 shrink-0 items-center justify-center text-base text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
			>
				&minus;
			</button>
			<input
				id={inputId}
				type="number"
				inputMode="numeric"
				value={value ?? ''}
				min={min}
				max={max}
				step={step}
				disabled={disabled}
				aria-label={label}
				onChange={(e) => {
					const next = Number(e.target.value);
					if (e.target.value !== '' && Number.isFinite(next)) commit(next);
				}}
				className="h-full w-full min-w-0 border-x border-input bg-transparent px-2 text-center text-sm tabular-nums focus:outline-none disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
			/>
			<button
				type="button"
				aria-label="Increase"
				disabled={disabled || atMax}
				onClick={() => commit(current + step)}
				className="flex h-full w-8 shrink-0 items-center justify-center text-base text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
			>
				+
			</button>
		</div>
	);
}

import { type ComponentProps, forwardRef } from 'react';
import { cn } from '../../lib/utils';

// forwardRef so callers that drive the input imperatively — notably react-hook-form's
// `register()`, which writes values through the ref on reset()/setValue() — can reach the
// underlying <input>. Without it, edit forms open with blank fields under React 18.
/** Input — shadcn/ui, 44px tall (WCAG touch target), themed by the Brick & Ecru tokens. */
export const Input = forwardRef<HTMLInputElement, ComponentProps<'input'>>(
	({ className, type, ...props }, ref) => {
		return (
			<input
				ref={ref}
				type={type}
				className={cn(
					'flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
					className,
				)}
				{...props}
			/>
		);
	},
);
Input.displayName = 'Input';

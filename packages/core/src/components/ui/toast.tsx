import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useState,
} from 'react';
import { cn } from '../../lib/utils';

type ToastVariant = 'success' | 'error' | 'default';
type ToastItem = { id: number; message: string; variant: ToastVariant };

type ToastContextValue = {
	push: (message: string, variant: ToastVariant) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

let pushToast: ToastContextValue['push'] | null = null;

/** Imperative toast API — sonner-style, backed by ToastProvider. */
export const toast = {
	success: (message: string) => pushToast?.(message, 'success'),
	error: (message: string) => pushToast?.(message, 'error'),
	message: (message: string) => pushToast?.(message, 'default'),
};

export function ToastProvider({ children }: { children: ReactNode }) {
	const [items, setItems] = useState<ToastItem[]>([]);
	const push = useCallback((message: string, variant: ToastVariant) => {
		const id = Date.now() + Math.random();
		setItems((prev) => [...prev, { id, message, variant }]);
		window.setTimeout(
			() => setItems((prev) => prev.filter((t) => t.id !== id)),
			4000,
		);
	}, []);

	useEffect(() => {
		pushToast = push;
		return () => {
			pushToast = null;
		};
	}, [push]);

	return (
		<ToastContext.Provider value={{ push }}>
			{children}
			<div
				aria-live="polite"
				className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2"
			>
				{items.map((t) => (
					<div
						key={t.id}
						role="status"
						className={cn(
							'pointer-events-auto rounded-lg border px-4 py-3 text-sm shadow-lg',
							t.variant === 'success' &&
								'border-border bg-card text-card-foreground',
							t.variant === 'error' &&
								'border-destructive/40 bg-destructive/5 text-destructive',
							t.variant === 'default' &&
								'border-border bg-card text-card-foreground',
						)}
					>
						{t.message}
					</div>
				))}
			</div>
		</ToastContext.Provider>
	);
}

export function useToast() {
	const ctx = useContext(ToastContext);
	if (!ctx) throw new Error('useToast requires ToastProvider');
	return ctx;
}

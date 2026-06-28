import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useState,
} from 'react';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from './alert-dialog';

export type ConfirmOptions = {
	title: string;
	description?: string;
	okText?: string;
	cancelText?: string;
	destructive?: boolean;
	onConfirm: () => void;
};

type ConfirmContextValue = {
	request: (options: ConfirmOptions) => void;
};

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

let requestConfirm: ConfirmContextValue['request'] | null = null;

/** Imperative confirm API — replaces Ant Design modal.confirm. */
export function confirm(options: ConfirmOptions): void {
	requestConfirm?.(options);
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
	const [state, setState] = useState<ConfirmOptions | null>(null);
	const request = useCallback((options: ConfirmOptions) => {
		setState(options);
	}, []);

	useEffect(() => {
		requestConfirm = request;
		return () => {
			requestConfirm = null;
		};
	}, [request]);

	const close = () => setState(null);
	const handleConfirm = () => {
		state?.onConfirm();
		close();
	};

	return (
		<ConfirmContext.Provider value={{ request }}>
			{children}
			<AlertDialog
				open={!!state}
				onOpenChange={(open) => {
					if (!open) close();
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{state?.title}</AlertDialogTitle>
						{state?.description ? (
							<AlertDialogDescription>
								{state.description}
							</AlertDialogDescription>
						) : null}
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>
							{state?.cancelText ?? 'Cancel'}
						</AlertDialogCancel>
						<AlertDialogAction
							variant={state?.destructive ? 'destructive' : 'default'}
							onClick={handleConfirm}
						>
							{state?.okText ?? 'OK'}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</ConfirmContext.Provider>
	);
}

export function useConfirm() {
	const ctx = useContext(ConfirmContext);
	if (!ctx) throw new Error('useConfirm requires ConfirmProvider');
	return ctx;
}

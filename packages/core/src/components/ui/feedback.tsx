import type { ReactNode } from 'react';
import { ConfirmProvider } from './confirm';
import { ToastProvider } from './toast';

/** Mount once near the app root — toast + confirm replace Ant Design App.useApp(). */
export function FeedbackProvider({ children }: { children: ReactNode }) {
	return (
		<ToastProvider>
			<ConfirmProvider>{children}</ConfirmProvider>
		</ToastProvider>
	);
}

export { type ConfirmOptions, confirm } from './confirm';
export { toast } from './toast';

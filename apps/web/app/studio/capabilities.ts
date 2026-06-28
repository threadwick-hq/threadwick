import { setCapabilities } from '@threadwick/core/capabilities';

/** Initialise studio capability flags from Vite env (defaults keep the app offline-complete). */
export function initStudioCapabilities(): void {
	const ravelry = import.meta.env.VITE_RAVELRY_ENABLED === 'true';
	setCapabilities({ ravelry });
}

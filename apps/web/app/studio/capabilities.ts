import { setCapabilities } from '@threadwick/core/capabilities';

/** Initialise studio capability flags from Vite env (defaults keep the app offline-complete). */
export function initStudioCapabilities(): void {
	const ravelry = import.meta.env.VITE_RAVELRY_ENABLED === 'true';
	// Marketplace is the native default; a private/offline build opts out.
	const marketplace = import.meta.env.VITE_MARKETPLACE_ENABLED !== 'false';
	setCapabilities({ ravelry, marketplace });
}

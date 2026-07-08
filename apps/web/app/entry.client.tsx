import { StrictMode, startTransition } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { HydratedRouter } from 'react-router/dom';
import { initStudioCapabilities } from './studio/capabilities';

// Set capability flags before the first render so a decoupled build never
// flashes gated (e.g. marketplace) surfaces.
initStudioCapabilities();

startTransition(() => {
	hydrateRoot(
		document,
		<StrictMode>
			<HydratedRouter />
		</StrictMode>,
	);
});

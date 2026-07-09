import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), reactRouter()],
	// The @threadwick/* workspace packages export TypeScript source and are linked through pnpm
	// workspace symlinks. Deduping React/React-DOM to a single copy keeps a dev re-optimize from
	// loading a second React and breaking hooks app-wide. The former optimizeDeps.include
	// workaround (force-prebundle the broad `export *` barrels so the optimizer stayed to one pass)
	// is gone: #150 split those barrels into narrow layer subpaths, so the dev optimizer no longer
	// discovers a large shared barrel late and re-bundles mid-session.
	resolve: {
		dedupe: ['react', 'react-dom'],
	},
});

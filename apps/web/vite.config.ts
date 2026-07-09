import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), reactRouter()],
	// The @threadwick/* workspace packages export TypeScript source (no dist build) and are linked
	// through pnpm workspace symlinks; they pull heavy deps (Radix, React-Aria, Font Awesome) that
	// Vite's dev optimizer would otherwise discover lazily and re-bundle mid-session. Deduping
	// React/React-DOM to a single copy keeps that re-optimize from loading a second React and
	// breaking hooks app-wide; forcing the linked barrels apps/web consumes (incl. the lazily-routed
	// /studio editor) into optimizeDeps keeps the optimizer to one startup pass so the re-optimize
	// reload doesn't fire at all. (Production bundles once, so both are dev-only.)
	resolve: {
		dedupe: ['react', 'react-dom'],
	},
	optimizeDeps: {
		include: [
			'@threadwick/core/components',
			'@threadwick/core/brand',
			'@threadwick/editor',
			'@threadwick/editor/browser',
		],
	},
});

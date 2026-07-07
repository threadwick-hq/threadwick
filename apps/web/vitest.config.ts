import { defineConfig } from 'vitest/config';

// A dedicated vitest config: the app's vite.config.ts loads the React Router
// framework plugin, which vitest must not boot just to run pure-function tests.
export default defineConfig({
	test: {
		include: ['test/**/*.test.ts'],
	},
});

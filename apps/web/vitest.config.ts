import { defineConfig } from 'vitest/config';

// A dedicated vitest config: the app's vite.config.ts loads the React Router
// framework plugin, which vitest must not boot just to run pure-function tests.
// Both include globs matter — test/ (seed tests) and app/ (colocated tests) —
// dropping either silently removes tests from the turbo gate.
export default defineConfig({
	test: {
		environment: 'node',
		include: ['test/**/*.test.ts', 'app/**/*.test.ts'],
	},
});

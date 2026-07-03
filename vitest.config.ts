import { defineConfig } from 'vitest/config';

/** Root-level tests cover repo tooling (scripts/); packages run their own. */
export default defineConfig({
	test: {
		include: ['scripts/**/*.test.ts'],
	},
});

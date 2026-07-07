// Seed test wiring @threadwick/core into `turbo run test` (TW — migration test net).
// src/tokens/tokens.ts is GENERATED from tokens.json (see packages/core/AGENTS.md) — this
// pins that the generated palette exports parse, cover both themes, and still carry the
// role tokens the rest of the design system (theme/antd.ts, components) depends on.

import { describe, expect, it } from 'vitest';
import { tokens } from '../src/tokens/tokens';

const REQUIRED_ROLE_TOKENS = [
	'primary',
	'onPrimary',
	'text',
	'textSecondary',
	'bgLayout',
	'bgContainer',
	'border',
	'focus',
] as const;

describe('generated design tokens (src/tokens/tokens.ts)', () => {
	it('exports both a light and a dark theme', () => {
		expect(Object.keys(tokens).sort()).toEqual(['dark', 'light']);
	});

	it.each([
		'light',
		'dark',
	] as const)('%s theme carries every required role token as an OKLCH string', (mode) => {
		for (const role of REQUIRED_ROLE_TOKENS) {
			const value = tokens[mode][role];
			expect(typeof value).toBe('string');
			expect(value).toMatch(/^oklch\(/);
		}
	});

	it.each([
		'light',
		'dark',
	] as const)('%s theme carries the full semantic + yarn palettes', (mode) => {
		const { semantic, yarn } = tokens[mode];
		expect(Object.keys(semantic).sort()).toEqual([
			'danger',
			'info',
			'success',
			'warning',
		]);
		expect(Object.keys(yarn).sort()).toEqual([
			'brick',
			'clay',
			'fern',
			'ochre',
			'plum',
			'teal',
		]);
	});
});

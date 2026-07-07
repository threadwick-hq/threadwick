// Seed test wiring threadwick-web into `turbo run test` (TW — migration test net).
// app/studio/maker-status.ts is pure display mapping (labels, status-dot classes,
// progress %) over the @threadwick/types maker-plane unions — no DOM, no storage.

import type { MakerStatus } from '@threadwick/types';
import { describe, expect, it } from 'vitest';
import {
	MAKER_STATUS_OPTIONS,
	makerStatusDotClass,
	makerStatusLabel,
	patternSourceLabel,
	refProgressPercent,
} from '../app/studio/maker-status';

describe('makerStatusLabel', () => {
	it('maps every maker status to its display label', () => {
		const labels = MAKER_STATUS_OPTIONS.map((s) => makerStatusLabel(s));
		expect(labels).toEqual([
			'Draft',
			'In progress',
			'On hold',
			'Done',
			'Frogged',
		]);
	});

	it('falls back to Draft when the status is undefined', () => {
		expect(makerStatusLabel(undefined)).toBe('Draft');
	});
});

describe('makerStatusDotClass', () => {
	it('maps each status through MAKER_STATUS_COLOR to a Tailwind background class', () => {
		const expected: Record<MakerStatus, string> = {
			draft: 'bg-muted-foreground',
			'in-progress': 'bg-sky-500',
			'on-hold': 'bg-amber-500',
			done: 'bg-yarn-fern',
			frogged: 'bg-destructive',
		};
		for (const status of MAKER_STATUS_OPTIONS) {
			expect(makerStatusDotClass(status)).toBe(expected[status]);
		}
	});
});

describe('patternSourceLabel', () => {
	it('maps the known sources and passes unknown values through', () => {
		expect(patternSourceLabel('threadwick')).toBe('Threadwick');
		expect(patternSourceLabel('ravelry')).toBe('Ravelry');
		expect(patternSourceLabel('blog')).toBe('Blog');
		expect(patternSourceLabel('pdf')).toBe('PDF');
		expect(patternSourceLabel('mystery')).toBe('mystery');
	});
});

describe('refProgressPercent', () => {
	it('returns 100 when explicitly completed, regardless of counts', () => {
		expect(
			refProgressPercent({
				progress: { completed: true, unitsDone: 1, unitsTotal: 10 },
			}),
		).toBe(100);
	});

	it('rounds done/total to a whole percent, capped at 100', () => {
		expect(
			refProgressPercent({ progress: { unitsDone: 5, unitsTotal: 11 } }),
		).toBe(45);
		expect(
			refProgressPercent({ progress: { unitsDone: 20, unitsTotal: 10 } }),
		).toBe(100);
	});

	it('without a total: any progress reads as 100, none as 0', () => {
		expect(refProgressPercent({ progress: { unitsDone: 3 } })).toBe(100);
		expect(refProgressPercent({ progress: { unitsDone: 0 } })).toBe(0);
		expect(refProgressPercent({})).toBe(0);
	});
});

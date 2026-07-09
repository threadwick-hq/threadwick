import assert from 'node:assert/strict';
import { describe, test } from 'vitest';

import {
	advancePatternProgress,
	aggregateProjectProgress,
	decomposeRound,
	effectiveFollowMode,
	flattenFollowUnits,
	undoPatternProgress,
} from '../src/index';
import { activeVersion, normalizeProject } from '../src/model';
import { sampleProject } from '../src/sample';
import type { PatternReference } from '../src/types';

describe('follow progress machine', () => {
	test('advance and undo over per-row units', () => {
		const prj = sampleProject();
		const pat = activeVersion(prj).patterns[0]!;
		const mode = 'per-row' as const;
		const total = flattenFollowUnits(pat, mode).length;
		assert.ok(total >= 2);

		let progress = advancePatternProgress(undefined, pat, mode);
		assert.equal(progress.unitsDone, 1);
		assert.equal(progress.unitsTotal, total);
		assert.ok(progress.cursor);

		progress = advancePatternProgress(progress, pat, mode);
		assert.equal(progress.unitsDone, 2);

		const undone = undoPatternProgress(progress, pat, mode);
		assert.equal(undone.unitsDone, 1);
		assert.notEqual(undone.completed, true);
	});

	test('advance completes the final unit', () => {
		const prj = sampleProject();
		const pat = activeVersion(prj).patterns[0]!;
		const mode = 'per-row' as const;
		const total = flattenFollowUnits(pat, mode).length;

		let progress = advancePatternProgress(undefined, pat, mode);
		for (let i = 1; i < total; i++) {
			progress = advancePatternProgress(progress, pat, mode);
		}
		assert.equal(progress.unitsDone, total);
		assert.equal(progress.completed, true);
	});

	test('pattern mode advances over decomposed bites', () => {
		const prj = sampleProject();
		const pat = activeVersion(prj).patterns[0]!;
		const r2 = pat.rounds[2];
		assert.ok(r2);
		const d = decomposeRound(pat, r2.id, 'pattern');
		assert.ok(d.units.length > 1);

		let progress = advancePatternProgress(undefined, pat, 'pattern');
		const units = flattenFollowUnits(pat, 'pattern');
		for (let i = 1; i < units.length; i++) {
			progress = advancePatternProgress(progress, pat, 'pattern');
		}
		assert.equal(progress.unitsDone, units.length);
		assert.equal(progress.completed, true);
	});

	test('aggregateProjectProgress sums refs', () => {
		const prj = sampleProject();
		const pat = activeVersion(prj).patterns[0]!;
		const ref: PatternReference = {
			id: 'ref-1',
			label: pat.name,
			source: 'threadwick',
			patternId: pat.id,
			progress: advancePatternProgress(undefined, pat, 'per-row'),
		};
		prj.makePatterns = [ref];

		const agg = aggregateProjectProgress(prj, (id) =>
			activeVersion(prj).patterns.find((p) => p.id === id),
		);
		assert.equal(agg.unitsDone, 1);
		assert.ok(agg.unitsTotal > 1);
		assert.ok(agg.percent > 0);
	});

	test('effectiveFollowMode forces checklist for external refs', () => {
		const ref: PatternReference = {
			id: 'x',
			label: 'Blog pattern',
			source: 'blog',
			url: 'https://example.com',
			followMode: 'granular',
		};
		assert.equal(effectiveFollowMode(ref), 'checklist');
	});
});

describe('normalizeProject makePatterns parsing', () => {
	test('ignores the retired patternIds field; only makePatterns carries refs', () => {
		const prj = normalizeProject({
			name: 'Make',
			versions: [
				{
					label: 'v1',
					status: 'draft',
					patterns: [
						{
							id: 'pat-a',
							name: 'Square',
							construction: 'granny',
							rounds: [],
							stitches: [],
						},
					],
				},
			],
			patternIds: ['pat-a'],
			makePatterns: [{ source: 'threadwick', patternId: 'pat-a' }],
		});
		assert.equal(prj.makePatterns?.length, 1);
		assert.equal(prj.makePatterns?.[0]?.source, 'threadwick');
		assert.equal(prj.makePatterns?.[0]?.patternId, 'pat-a');
		assert.equal(prj.makePatterns?.[0]?.label, 'Square');
		assert.equal(prj.makerStatus, 'draft');
	});

	test('normalization is idempotent', () => {
		const once = normalizeProject({
			name: 'Make',
			makePatterns: [{ source: 'threadwick', patternId: 'p1', label: 'P1' }],
			versions: [{ label: 'v1', status: 'draft', patterns: [] }],
		});
		const twice = normalizeProject(JSON.parse(JSON.stringify(once)));
		assert.deepEqual(twice.makePatterns, once.makePatterns);
		assert.equal(twice.makerStatus, once.makerStatus);
	});
});

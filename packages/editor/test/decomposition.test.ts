import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { sampleProject } from '../src/fixtures';
import {
	decomposePattern,
	decomposeRound,
	hasFollowMarks,
	roundStitchOrder,
	stitchClusters,
	totalUnits,
} from '../src/index';
import { activeVersion, newPattern } from '../src/model';
import type { ChartPattern, Stitch } from '../src/types';
import { uid } from '../src/util';

function patFromSample(): ChartPattern {
	const prj = sampleProject();
	return activeVersion(prj).patterns[0]!;
}

describe('decomposition engine', () => {
	test('per-row mode yields one unit per working round', () => {
		const pat = patFromSample();
		const decs = decomposePattern(pat, 'per-row');
		assert.equal(decs.length, 2); // Round 1 + Round 2 (not Start)
		for (const d of decs) {
			assert.equal(d.effectiveMode, 'per-row');
			assert.equal(d.units.length, 1);
			assert.ok(d.units[0]?.stitchIds.length > 0);
			assert.match(d.units[0]?.address, /@row$/);
		}
	});

	test('unmarked round falls back to per-row for pattern and granular', () => {
		const pat = newPattern('plain');
		const r = pat.rounds[1]!;
		pat.stitches.push({
			id: uid('st'),
			round: r.id,
			type: 'sc',
			origin: null,
			base: null,
			x: 0,
			y: 0,
			rot: 0,
			len: null,
			color: null,
			mirror: false,
		});
		for (const mode of ['pattern', 'granular'] as const) {
			const d = decomposeRound(pat, r.id, mode);
			assert.equal(d.requestedMode, mode);
			assert.equal(d.effectiveMode, 'per-row');
			assert.equal(d.units.length, 1);
		}
	});

	test('pattern mode splits a marked granny round into corner and side bites', () => {
		const pat = patFromSample();
		const r2 = pat.rounds.find((r) => r.name === 'Round 2')!;
		assert.ok(hasFollowMarks(r2.followMarks));
		const d = decomposeRound(pat, r2.id, 'pattern');
		assert.equal(d.effectiveMode, 'pattern');
		// four corners → eight bites (corner + side alternating)
		assert.equal(d.units.length, 8);
		assert.equal(d.units[0]?.index, 1);
		assert.equal(d.units[0]?.total, 8);
		const covered = new Set(d.units.flatMap((u) => u.stitchIds));
		const order = roundStitchOrder(pat, r2.id);
		assert.equal(covered.size, order.length);
	});

	test('granular mode splits marked round into stitch-type clusters', () => {
		const pat = patFromSample();
		const r2 = pat.rounds.find((r) => r.name === 'Round 2')!;
		const d = decomposeRound(pat, r2.id, 'granular');
		assert.equal(d.effectiveMode, 'granular');
		assert.ok(d.units.length > 8);
		for (const u of d.units) {
			assert.ok(u.clusterIndex);
			assert.equal(u.clusterTotal, d.units.length);
			assert.match(u.address, /\/g\//);
		}
	});

	test('repeat marks drive pattern bites when corners are absent', () => {
		const pat = newPattern('repeat');
		const r = pat.rounds[1]!;
		const mk = (type: Stitch['type'], i: number): Stitch => ({
			id: uid('st'),
			round: r.id,
			type,
			origin: i > 0 ? `prev-${i}` : null,
			base: null,
			x: i * 10,
			y: 0,
			rot: 0,
			len: null,
			color: null,
			mirror: false,
		});
		const s1 = { ...mk('dc', 0), id: 'a', origin: null };
		const s2 = { ...mk('dc', 1), id: 'b', origin: 'a' };
		const s3 = { ...mk('ch', 2), id: 'c', origin: 'b' };
		pat.stitches = [s1, s2, s3];
		pat.activeRound = r.id;
		r.followMarks = {
			corners: [],
			repeats: [{ id: 'rep1', fromStitchId: 'a', toStitchId: 'c', times: 4 }],
		};
		const d = decomposeRound(pat, r.id, 'pattern');
		assert.equal(d.effectiveMode, 'pattern');
		assert.equal(d.units.length, 4);
		assert.equal(d.units[3]?.repeatIndex, 4);
		assert.equal(d.units[3]?.repeatTotal, 4);
	});

	test('stitchClusters groups consecutive same-type stitches', () => {
		const stitches = [
			{ type: 'dc' },
			{ type: 'dc' },
			{ type: 'ch' },
			{ type: 'dc' },
		] as Stitch[];
		const clusters = stitchClusters(stitches);
		assert.equal(clusters.length, 3);
		assert.equal(clusters[0]?.length, 2);
	});

	test('totalUnits aggregates across working rounds', () => {
		const pat = patFromSample();
		assert.equal(totalUnits(pat, 'per-row'), 2);
		assert.ok(totalUnits(pat, 'pattern') > 2);
	});
});

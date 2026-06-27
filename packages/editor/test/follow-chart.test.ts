import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import {
	deriveFollowChartModel,
	resolveFollowChartContext,
	stitchInspectInfo,
} from '../src/follow-chart';
import { advancePatternProgress as advance } from '../src/progress';
import { sampleProject } from '../src/sample';
import { activeVersion } from '../src/model';

describe('follow chart', () => {
	test('deriveFollowChartModel ghostes future rounds at start', () => {
		const prj = sampleProject();
		const pat = activeVersion(prj).patterns[0]!;
		const model = deriveFollowChartModel(pat, undefined, 'per-row');
		const roundIds = [...new Set(pat.stitches.map((s) => s.round))];
		const startRound = pat.rounds[0]!.id;
		const working = roundIds.filter((id) => id !== startRound);
		const currentRound = model.currentRoundId;
		assert.ok(currentRound);
		for (const st of pat.stitches) {
			const state = model.stitchStates.get(st.id)!;
			if (st.round === currentRound) {
				assert.equal(state, 'current');
			} else if (working.indexOf(st.round) > working.indexOf(currentRound)) {
				assert.equal(state, 'ghosted');
			}
		}
	});

	test('advanced progress marks earlier rounds completed', () => {
		const prj = sampleProject();
		const pat = activeVersion(prj).patterns[0]!;
		let progress = advance(undefined, pat, 'per-row');
		progress = advance(progress, pat, 'per-row');
		const model = deriveFollowChartModel(pat, progress, 'per-row');
		assert.ok(model.currentRoundId);
		const completed = pat.stitches.filter(
			(s) => model.stitchStates.get(s.id) === 'completed',
		);
		assert.ok(completed.length > 0);
	});

	test('pattern mode highlights current bite stitches', () => {
		const prj = sampleProject();
		const pat = activeVersion(prj).patterns[0]!;
		const progress = advance(undefined, pat, 'pattern');
		const model = deriveFollowChartModel(pat, progress, 'pattern');
		assert.ok(model.focusStitchIds.length > 0);
		for (const id of model.focusStitchIds) {
			assert.equal(model.stitchStates.get(id), 'current');
		}
	});

	test('followChartToSVG emits interactive stitches', () => {
		const prj = sampleProject();
		const pat = activeVersion(prj).patterns[0]!;
		const { model, svg } = resolveFollowChartContext(pat, undefined, 'pattern');
		assert.match(svg, /class="stitch follow-/);
		assert.match(svg, /data-id="/);
		assert.ok(model.focusStitchIds.length);
	});

	test('stitchInspectInfo returns stitch metadata', () => {
		const prj = sampleProject();
		const pat = activeVersion(prj).patterns[0]!;
		const st = pat.stitches[0]!;
		const info = stitchInspectInfo(pat, st.id);
		assert.ok(info);
		assert.equal(info!.id, st.id);
		assert.ok(info!.name.length);
	});
});

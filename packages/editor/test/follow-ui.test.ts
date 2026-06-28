import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import {
	advancePatternProgress,
	deriveCounterPills,
	deriveFollowSections,
	followActionLabel,
	newPattern,
	resolveFollowContext,
	segmentsFromInstructionLine,
} from '../src/index';
import { activeVersion } from '../src/model';
import { sampleProject } from '../src/sample';

describe('follow UI helpers', () => {
	test('segmentsFromInstructionLine emphasises stitch tokens', () => {
		const segs = segmentsFromInstructionLine('3 ch, 2 dc, sl st');
		assert.equal(segs.length, 5);
		assert.equal(segs[0]?.kind, 'stitch');
		assert.equal(segs[0]?.text, '3 ch');
		assert.equal(segs[1]?.kind, 'connector');
		assert.equal(segs[2]?.kind, 'stitch');
	});

	test('followActionLabel per mode', () => {
		assert.equal(followActionLabel('per-row'), 'Round done');
		assert.equal(followActionLabel('pattern'), 'Next repeat');
		assert.equal(followActionLabel('granular'), 'Cluster done');
	});

	test('deriveCounterPills includes round and stitch counts', () => {
		const prj = sampleProject();
		const pat = activeVersion(prj).patterns[0]!;
		const pills = deriveCounterPills(undefined, pat, 'pattern');
		assert.ok(pills.some((p) => p.label === 'Round'));
	});

	test('deriveFollowSections opens round after start', () => {
		const prj = sampleProject();
		const pat = activeVersion(prj).patterns[0]!;
		const progress = advancePatternProgress(undefined, pat, 'pattern');
		const sections = deriveFollowSections(progress, pat, 'pattern');
		assert.equal(sections[0]?.done, true);
		assert.equal(sections[1]?.open, true);
	});

	test('resolveFollowContext uses suggested follow mode from ref', () => {
		const prj = sampleProject();
		const pat = activeVersion(prj).patterns[0];
		assert.ok(pat);
		const makePattern = prj.makePatterns?.[0];
		assert.ok(makePattern);
		const ref = { ...makePattern, progress: undefined };
		const ctx = resolveFollowContext(ref, pat);
		assert.equal(ctx.mode, 'pattern');
		assert.equal(ctx.actionLabel, 'Next repeat');
		assert.equal(ctx.canUndo, false);
	});

	test('empty pattern sections still render', () => {
		const pat = newPattern('Empty');
		const sections = deriveFollowSections(undefined, pat, 'per-row');
		assert.equal(sections.length, 3);
	});
});

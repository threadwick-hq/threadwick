import assert from 'node:assert/strict';
import { describe, test } from 'vitest';

import {
	advanceExternalProgress,
	completeExternalProgress,
	deriveExternalChecklistSections,
	externalSourceHref,
	externalSourceLabel,
	isExternalRef,
	resolveExternalFollowContext,
	undoExternalProgress,
} from '../src/external-follow';
import { aggregateProjectProgress, effectiveFollowMode } from '../src/progress';
import { newProject } from '../src/model';
import type { PatternReference } from '../src/types';

const ravelryRef = {
	id: 'ext-1',
	label: 'Wildflower square',
	source: 'ravelry',
	url: 'https://www.ravelry.com/patterns/library/wildflower-square',
	designer: '@mara_makes',
	ravelryId: '12345',
} satisfies PatternReference;

describe('external follow fallback', () => {
	test('isExternalRef and source helpers', () => {
		assert.equal(isExternalRef(ravelryRef), true);
		assert.equal(
			externalSourceHref(ravelryRef),
			'https://www.ravelry.com/patterns/library/wildflower-square',
		);
		assert.equal(externalSourceLabel(ravelryRef), 'Open on Ravelry');
		assert.equal(externalSourceLabel({ ...ravelryRef, source: 'pdf' }), 'Open PDF');
	});

	test('advance and undo checklist rounds', () => {
		let progress = advanceExternalProgress(undefined);
		assert.equal(progress.unitsDone, 1);
		assert.equal(progress.unitsTotal, 2);
		assert.equal(progress.cursor?.followMode, 'checklist');

		progress = advanceExternalProgress(progress);
		assert.equal(progress.unitsDone, 2);
		assert.equal(progress.unitsTotal, 3);

		const undone = undoExternalProgress(progress);
		assert.equal(undone.unitsDone, 1);
		assert.notEqual(undone.completed, true);
	});

	test('complete marks ref finished', () => {
		let progress = advanceExternalProgress(undefined);
		progress = advanceExternalProgress(progress);
		const done = completeExternalProgress(progress);
		assert.equal(done.completed, true);
		assert.equal(done.unitsDone, 2);
	});

	test('deriveExternalChecklistSections lists done and current rounds', () => {
		let progress = advanceExternalProgress(undefined);
		progress = advanceExternalProgress(progress);
		const sections = deriveExternalChecklistSections(progress);
		assert.equal(sections.filter((s) => s.done).length, 2);
		assert.equal(sections.find((s) => s.open)?.title, 'Round 3');
	});

	test('resolveExternalFollowContext exposes open source', () => {
		const ctx = resolveExternalFollowContext(ravelryRef);
		assert.equal(ctx.mode, 'checklist');
		assert.equal(ctx.actionLabel, 'Round done');
		assert.equal(ctx.sourceHref, ravelryRef.url);
		assert.ok(ctx.sections.some((s) => s.open));
	});

	test('effectiveFollowMode forces checklist for external refs', () => {
		const ref: PatternReference = {
			...ravelryRef,
			followMode: 'granular',
		};
		assert.equal(effectiveFollowMode(ref), 'checklist');
	});

	test('aggregateProjectProgress includes external ref progress', () => {
		const ref: PatternReference = {
			...ravelryRef,
			progress: advanceExternalProgress(undefined),
		};
		const prj = newProject('Make');
		prj.makePatterns = [ref];
		const agg = aggregateProjectProgress(prj, () => undefined);
		assert.equal(agg.unitsDone, 1);
		assert.ok(agg.unitsTotal >= 1);
		assert.ok(agg.percent > 0);
	});
});

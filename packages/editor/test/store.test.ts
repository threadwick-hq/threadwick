// Store-dependent tests, run with vitest. The DOM-free core tests moved to
// packages/editor/test/core.test.ts (TW-010); these follow the store there in TW-011.

import assert from 'node:assert/strict';
import { test } from 'vitest';
import {
	activeVersion,
	chainOrder,
	draftVersion,
	publishedVersion,
	startRowId,
	topOfStitch,
} from '../src';
import { store } from '../src/browser';

const near = (a: number, b: number, eps = 1e-6) => Math.abs(a - b) < eps;

// ---- store -----------------------------------------------------------------
test('store: create, start, chain, splice, repair, undo/redo', () => {
	const pid = store.createProject('T');
	const patId = store.createPattern(pid, 'Sq')!;
	store.openPattern(pid, patId);
	const pat = () => store.currentPattern()!;
	const ringId = store.setStart('mr')!;
	assert.equal(pat().stitches.length, 1);
	const round = pat().activeRound;
	const a = store.placeStitch({
		type: 'dc',
		base: { kind: 'stitch', id: ringId },
		x: 0,
		y: 0,
		rot: 0,
		len: 30,
		originId: ringId,
	})!;
	const b = store.placeStitch({
		type: 'dc',
		base: { kind: 'stitch', id: ringId },
		x: 0,
		y: 0,
		rot: 0,
		len: 30,
		originId: a,
	})!;
	const c = store.placeStitch({
		type: 'dc',
		base: { kind: 'stitch', id: ringId },
		x: 0,
		y: 0,
		rot: 0,
		len: 30,
		originId: b,
	})!;
	assert.deepEqual(
		chainOrder(pat().stitches, round).map((s) => s.id),
		[a, b, c],
	);
	const x = store.placeStitch({
		type: 'dc',
		base: { kind: 'stitch', id: ringId },
		x: 0,
		y: 0,
		rot: 0,
		len: 30,
		originId: ringId,
	})!;
	assert.equal(pat().stitches.find((s) => s.id === a)!.origin, x);
	assert.equal(pat().stitches.find((s) => s.id === x)!.origin, ringId);
	assert.deepEqual(
		chainOrder(pat().stitches, round).map((s) => s.id),
		[x, a, b, c],
	);
	store.setSelection([a]);
	store.deleteSelection();
	assert.equal(pat().stitches.find((s) => s.id === b)!.origin, x);
	const n = pat().stitches.length;
	store.undo();
	assert.equal(pat().stitches.length, n + 1);
	store.redo();
	assert.equal(pat().stitches.length, n);
});
test('store: start marker lives alone in the Start row', () => {
	const pid = store.createProject('Z');
	const patId = store.createPattern(pid, 'Sq')!;
	store.openPattern(pid, patId);
	const pat = () => store.currentPattern()!;
	assert.equal(pat().rounds[0]!.name, 'Start');
	assert.equal(pat().activeRound, pat().rounds[0]!.id); // opens on the Start row
	const before = pat().rounds.length;
	store.setStart('mr');
	assert.equal(
		pat().rounds.length,
		before,
		'no new row added — the Start row pre-exists',
	);
	assert.equal(startRowId(pat()), pat().rounds[0]!.id);
	assert.notEqual(
		pat().activeRound,
		pat().rounds[0]!.id,
		'advances to a working row',
	);
	assert.equal(
		pat().stitches.filter((s) => s.round === pat().rounds[0]!.id).length,
		1,
	); // ring alone in Start
});
test('store: chains auto-align evenly between non-chain neighbours', () => {
	const pid = store.createProject('CH');
	const patId = store.createPattern(pid, 'Sq')!;
	store.openPattern(pid, patId);
	const pat = () => store.currentPattern()!;
	const ringId = store.setStart('mr')!;
	const round = pat().activeRound;
	const A = store.placeStitch({
		type: 'dc',
		base: { kind: 'stitch', id: ringId },
		x: -40,
		y: 0,
		rot: 0,
		len: 30,
		originId: ringId,
	})!;
	let o = A;
	const chs: string[] = [];
	for (let i = 0; i < 3; i++) {
		o = store.placeStitch({
			type: 'ch',
			base: { kind: 'stitch', id: o },
			x: 0,
			y: 0,
			rot: 0,
			len: null,
			originId: o,
		})!;
		chs.push(o);
	}
	store.placeStitch({
		type: 'dc',
		base: { kind: 'stitch', id: ringId },
		x: 40,
		y: 0,
		rot: 0,
		len: 30,
		originId: o,
	});
	const order = chainOrder(pat().stitches, round).filter(
		(s) => s.type === 'ch',
	);
	assert.equal(order.length, 3);
	assert.ok(order.every((s) => near(s.y, -30, 0.01)));
	assert.ok(
		near(order[1]!.x - order[0]!.x, 20, 0.01) &&
			near(order[2]!.x - order[1]!.x, 20, 0.01),
	);
	store.setSelection([order[1]!.id]);
	store.moveSelectionBy(0, -25);
	const mid = () => pat().stitches.find((s) => s.id === order[1]!.id)!;
	assert.equal(mid().auto, false);
	assert.ok(mid().y < -40);
	store.setSelection([order[1]!.id]);
	store.setChainAuto(true);
	assert.ok(near(mid().y, -30, 0.01));
});
test('store: live drag + slider coalesce into one undo entry', () => {
	const pid = store.createProject('LD');
	const patId = store.createPattern(pid, 'Sq')!;
	store.openPattern(pid, patId);
	const pat = () => store.currentPattern()!;
	const ringId = store.setStart('mr')!;
	const a = store.placeStitch({
		type: 'dc',
		base: { kind: 'stitch', id: ringId },
		x: 0,
		y: 0,
		rot: 0,
		len: 30,
		originId: ringId,
	})!;
	const aOf = () => pat().stitches.find((s) => s.id === a)!;

	store.setSelection([a]);
	const beforeDrag = store.undoStack.length;
	store.dragBegin();
	store.dragBy(5, 0);
	store.dragBy(5, 0);
	store.dragBy(5, 0);
	store.commitGesture();
	assert.equal(
		store.undoStack.length,
		beforeDrag + 1,
		'one undo entry for the whole drag',
	);
	assert.ok(near(aOf().x, 15, 1e-9));
	store.undo();
	assert.ok(near(aOf().x, 0, 1e-9), 'undo restores the pre-drag position');

	store.setSelection([a]);
	const beforeSlide = store.undoStack.length;
	store.liveUpdateSelection({ len: 40 });
	store.liveUpdateSelection({ len: 50 });
	store.endLive();
	assert.equal(
		store.undoStack.length,
		beforeSlide + 1,
		'one undo entry for the slider drag',
	);
	assert.equal(aOf().len, 50);
	store.undo();
	assert.equal(aOf().len, 30, 'undo restores the pre-slider length');
});
test('store: endpoint adjustments coalesce into one undo entry; chains de-automate', () => {
	const pid = store.createProject('HD');
	const patId = store.createPattern(pid, 'Sq')!;
	store.openPattern(pid, patId);
	const pat = () => store.currentPattern()!;
	const ringId = store.setStart('mr')!;
	const a = store.placeStitch({
		type: 'dc',
		base: { kind: 'stitch', id: ringId },
		x: 0,
		y: 0,
		rot: 0,
		len: 30,
		originId: ringId,
	})!;
	const ch = store.placeStitch({
		type: 'ch',
		base: { kind: 'stitch', id: a },
		x: 0,
		y: -30,
		rot: 0,
		len: null,
		originId: a,
	})!;
	const aOf = () => pat().stitches.find((s) => s.id === a)!;
	const chOf = () => pat().stitches.find((s) => s.id === ch)!;

	const before = store.undoStack.length;
	store.dragBegin();
	store.adjustStitch(a, { len: 40, rot: 15 });
	store.adjustStitch(a, { len: 45, rot: 30 });
	store.commitGesture();
	assert.equal(
		store.undoStack.length,
		before + 1,
		'one undo entry per handle gesture',
	);
	assert.equal(aOf().len, 45);
	assert.equal(aOf().rot, 30);
	store.undo();
	assert.equal(aOf().len, 30, 'undo restores the pre-gesture length');

	assert.notEqual(chOf().auto, false);
	store.dragBegin();
	store.adjustStitch(ch, { rot: 45 });
	store.commitGesture();
	assert.equal(
		chOf().auto,
		false,
		'manual endpoint adjustment turns chain auto off',
	);
	assert.equal(chOf().rot, 45);
});

test('store: pattern type guard + resources', () => {
	const pid = store.createProject('R');
	assert.equal(store.createPattern(pid, 'Flat thing', 'flat'), null);
	const yid = store.addResource(pid, 'yarns', { name: 'Cotton', hex: '#fff' })!;
	assert.ok(yid);
	store.updateResource(pid, 'yarns', yid, { brand: 'Acme' });
	assert.equal(
		activeVersion(store.getProject(pid)!).resources.yarns[0]!.brand,
		'Acme',
	);
	store.removeResource(pid, 'yarns', yid);
	assert.equal(activeVersion(store.getProject(pid)!).resources.yarns.length, 0);
});
test('store: mirrorSelection flips each stitch individually, one undo entry', () => {
	const pid = store.createProject('MI');
	const patId = store.createPattern(pid, 'Sq')!;
	store.openPattern(pid, patId);
	const pat = () => store.currentPattern()!;
	const ringId = store.setStart('mr')!;
	const a = store.placeStitch({
		type: 'dc',
		base: { kind: 'stitch', id: ringId },
		x: 0,
		y: 0,
		rot: 0,
		len: 30,
		originId: ringId,
	})!;
	const b = store.placeStitch({
		type: 'dc',
		base: { kind: 'stitch', id: ringId },
		x: 10,
		y: 0,
		rot: 0,
		len: 30,
		originId: a,
	})!;
	const of = (id: string) => pat().stitches.find((s) => s.id === id)!;
	store.updateSelection({}); // no-op on empty selection
	store.setSelection([a]);
	store.mirrorSelection();
	assert.equal(of(a).mirror, true);

	// mixed selection: each flips its own state
	store.setSelection([a, b]);
	const before = store.undoStack.length;
	store.mirrorSelection();
	assert.equal(store.undoStack.length, before + 1);
	assert.equal(of(a).mirror, false);
	assert.equal(of(b).mirror, true);
	store.undo();
	assert.equal(of(a).mirror, true);
	assert.equal(of(b).mirror, false);
});

test('store: evenRound fans stitches to equal radius', () => {
	const pid = store.createProject('E');
	const patId = store.createPattern(pid, 'Sq')!;
	store.openPattern(pid, patId);
	const r = store.setStart('mr')!;
	const round = store.currentPattern()!.activeRound; // working row after setStart auto-advances
	let o = r;
	for (const [,] of [
		[10, -20],
		[22, 3],
		[-5, 25],
		[-18, -9],
	])
		o = store.placeStitch({
			type: 'dc',
			base: { kind: 'stitch', id: r },
			x: 0,
			y: 0,
			rot: Math.random() * 90,
			len: 10 + Math.random() * 30,
			originId: o,
		})!;
	store.evenRound(round);
	const dcs = chainOrder(store.currentPattern()!.stitches, round).filter(
		(s) => s.type === 'dc',
	);
	const cx = dcs.reduce((a, s) => a + s.x, 0) / dcs.length,
		cy = dcs.reduce((a, s) => a + s.y, 0) / dcs.length;
	const radii = dcs.map((s) => {
		const h = topOfStitch(s);
		return Math.hypot(h.x - cx, h.y - cy);
	});
	const avg = radii.reduce((a, b) => a + b, 0) / radii.length;
	assert.ok(radii.every((r2) => Math.abs(r2 - avg) < 1.5));
});

test('store: version lifecycle — publish, new draft, outdate, isolation', () => {
	const pid = store.createProject('V');
	// a fresh project has a single draft
	const prj = () => store.getProject(pid)!;
	assert.equal(prj().versions.length, 1);
	assert.equal(activeVersion(prj()).status, 'draft');

	// edit the draft
	const pat1 = store.createPattern(pid, 'Sq')!;
	assert.ok(pat1);

	// publish it
	store.publishVersion(pid);
	assert.equal(publishedVersion(prj())!.label, 'v1');
	assert.equal(draftVersion(prj()), undefined);
	assert.ok(publishedVersion(prj())!.publishedAt);

	// published version is read-only: createPattern is refused
	assert.equal(store.createPattern(pid, 'Nope'), null);
	assert.equal(activeVersion(prj()).patterns.length, 1);

	// start a new draft — snapshots the published content into a fresh version
	const draftId = store.createDraft(pid)!;
	assert.equal(prj().versions.length, 2);
	assert.equal(draftVersion(prj())!.id, draftId);
	assert.equal(draftVersion(prj())!.label, 'v2');
	assert.equal(
		draftVersion(prj())!.patterns.length,
		1,
		'draft copies the published patterns',
	);
	assert.notEqual(
		draftVersion(prj())!.patterns[0]!.id,
		publishedVersion(prj())!.patterns[0]!.id,
		'snapshot gets fresh ids',
	);

	// calling createDraft again just returns the existing draft (one at a time)
	assert.equal(store.createDraft(pid), draftId);
	assert.equal(prj().versions.length, 2);

	// editing the draft must not touch the still-published v1
	const pubPatCount = publishedVersion(prj())!.patterns.length;
	store.createPattern(pid, 'Extra');
	assert.equal(draftVersion(prj())!.patterns.length, 2);
	assert.equal(
		publishedVersion(prj())!.patterns.length,
		pubPatCount,
		'published version is undisturbed',
	);

	// publishing the draft outdates the old published version
	store.publishVersion(pid);
	assert.equal(publishedVersion(prj())!.label, 'v2');
	assert.equal(prj().versions.filter((v) => v.status === 'outdated').length, 1);
	assert.equal(
		prj().versions.find((v) => v.label === 'v1')!.status,
		'outdated',
	);

	// discard a fresh draft → falls back to the published version
	store.createDraft(pid);
	assert.equal(prj().versions.length, 3);
	store.discardDraft(pid);
	assert.equal(prj().versions.length, 2);
	assert.equal(activeVersion(prj()).status, 'published');
});

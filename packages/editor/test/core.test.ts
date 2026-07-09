// DOM-free tests for the @threadwick/editor core, run with vitest. Exercises the chart + follow
// modules (via the internal aggregator) plus the sample fixture.
// The store-dependent cases (version lifecycle, undo/redo, ...) move here with the store in TW-011.

import assert from 'node:assert/strict';
import { test } from 'vitest';
import type { Base, Stitch, StitchType } from '../src';
import {
	activeVersion,
	basePoint,
	buildStitchShapes,
	chainFrom,
	chainOrder,
	chartToSVG,
	contentBounds,
	defaultLen,
	defaultOriginId,
	FILE_VERSION,
	fromPolar,
	isRealStitch,
	isStart,
	newPattern,
	newProject,
	normalizeProject,
	pickBase,
	projectFromFile,
	projectToFile,
	STITCHES,
	spacesForRound,
	stitchWithinRect,
	successorInRound,
	summarizeRound,
	toPolar,
	topOfStitch,
} from '../src';
import { sampleProject } from '../src/fixtures';

const near = (a: number, b: number, eps = 1e-6) => Math.abs(a - b) < eps;

// ---- geometry --------------------------------------------------------------
test('polar round-trips', () => {
	for (const [x, y] of [
		[10, 0],
		[0, 25],
		[-12, 7],
		[3, -19],
	]) {
		const { r, a } = toPolar(x!, y!);
		const p = fromPolar(r, a);
		assert.ok(near(p.x, x!, 1e-9) && near(p.y, y!, 1e-9));
	}
});

// ---- symbols ---------------------------------------------------------------
test('real vs non-real stitches', () => {
	assert.equal(isRealStitch('dc'), true);
	assert.equal(isRealStitch('ch'), false);
	assert.equal(isRealStitch('slst'), false);
	assert.equal(isRealStitch('mr'), false);
	assert.equal(isStart('mr'), true);
	assert.equal(isStart('dc'), false);
});
test('post heights grow sc<hdc<dc<tr<dtr', () => {
	const h = (t: StitchType) => buildStitchShapes(t).height;
	assert.ok(
		h('sc') < h('hdc') &&
			h('hdc') < h('dc') &&
			h('dc') < h('tr') &&
			h('tr') < h('dtr'),
	);
	assert.equal(defaultLen('dc'), STITCHES.dc.build().height);
});

// ---- render ----------------------------------------------------------------
test('topOfStitch is above the base for an upright dc', () => {
	const head = topOfStitch({ type: 'dc', x: 0, y: 0, rot: 0, len: 32 });
	assert.ok(near(head.x, 0) && near(head.y, -32));
});
test('topOfStitch rotates with the stitch', () => {
	const head = topOfStitch({ type: 'dc', x: 0, y: 0, rot: 90, len: 20 });
	assert.ok(near(head.x, 20, 1e-6) && near(head.y, 0, 1e-6));
});
test('chain head is the far end, buffered off the anchor', () => {
	const head = topOfStitch({ type: 'ch', x: 0, y: 0, rot: 0, len: null });
	assert.ok(near(head.x, 0, 1e-9));
	assert.ok(head.y < -10);
});
test('contentBounds covers placed stitches', () => {
	const b = contentBounds([{ type: 'dc', x: 0, y: 0, rot: 0, len: 30 }]);
	assert.ok(b.minY <= -30 && b.maxY >= 0);
});

// ---- connectivity ----------------------------------------------------------
function ring(round: string): Stitch {
	return {
		id: 'ring',
		round,
		type: 'mr',
		origin: null,
		base: null,
		x: 0,
		y: 0,
		rot: 0,
		len: null,
		color: null,
		mirror: false,
	};
}
function dc(
	id: string,
	round: string,
	origin: string | null,
	x: number,
	y: number,
): Stitch {
	return {
		id,
		round,
		type: 'dc',
		origin,
		base: { kind: 'stitch', id: 'ring' },
		x,
		y,
		rot: 0,
		len: 30,
		color: null,
		mirror: false,
	};
}

test('chainOrder follows origin links', () => {
	const s = [
		ring('R'),
		dc('a', 'R', 'ring', 10, 0),
		dc('b', 'R', 'a', 20, 0),
		dc('c', 'R', 'b', 30, 0),
	];
	assert.deepEqual(
		chainOrder(s, 'R').map((x) => x.id),
		['ring', 'a', 'b', 'c'],
	);
});
test('spacesForRound = real-1 between consecutive real stitches', () => {
	const s = [
		ring('R'),
		dc('a', 'R', 'ring', 0, -30),
		dc('b', 'R', 'a', 30, -30),
		dc('c', 'R', 'b', 60, -30),
	];
	const sp = spacesForRound(s, 'R');
	assert.equal(sp.length, 2);
	assert.ok(near(sp[0]?.point.x, 15) && near(sp[0]?.point.y, -60));
});
test('pickBase prefers the nearest space/stitch', () => {
	const s = [
		ring('R'),
		dc('a', 'R', 'ring', 0, -30),
		dc('b', 'R', 'a', 40, -30),
	];
	assert.equal(pickBase(s, 20, -60)?.kind, 'space');
	const atHead = pickBase(s, 0, -60)!;
	assert.equal(atHead.kind, 'stitch');
	assert.equal(atHead.kind === 'stitch' && atHead.id, 'a');
	assert.equal(pickBase(s, 999, 999), null);
});
test('successorInRound + chainFrom', () => {
	const s = [
		ring('R'),
		dc('a', 'R', 'ring', 0, 0),
		dc('b', 'R', 'a', 0, 0),
		dc('c', 'R', 'b', 0, 0),
	];
	assert.equal(successorInRound(s, 'a', 'R')?.id, 'b');
	assert.deepEqual(
		chainFrom(s, 'b', 'R').map((x) => x.id),
		['b', 'c'],
	);
});
test('defaultOriginId = tail of round, else previous round tail', () => {
	const rounds = [
		{ id: 'R1', name: 'R1' },
		{ id: 'R2', name: 'R2' },
	];
	const s = [ring('R1'), dc('a', 'R1', 'ring', 0, 0), dc('b', 'R1', 'a', 0, 0)];
	assert.equal(defaultOriginId(s, rounds, 'R1'), 'b');
	assert.equal(defaultOriginId(s, rounds, 'R2'), 'b');
});
test('stitchWithinRect needs head AND base inside', () => {
	const st = dc('a', 'R', null, 0, 0); // base (0,0), head (0,-30)
	assert.equal(stitchWithinRect(st, -10, -40, 10, 10), true);
	assert.equal(stitchWithinRect(st, -10, -10, 10, 10), false, 'head outside');
	assert.equal(stitchWithinRect(st, -10, -40, 10, -5), false, 'base outside');
});

test('basePoint resolves stitch + space', () => {
	const s = [dc('a', 'R', null, 0, -30), dc('b', 'R', 'a', 40, -30)];
	const byId = new Map(s.map((x) => [x.id, x]));
	const stitchBase = basePoint(byId, { kind: 'stitch', id: 'a' });
	const spaceBase = basePoint(byId, { kind: 'space', ids: ['a', 'b'] });
	assert.ok(stitchBase && near(stitchBase.y, -60));
	assert.ok(spaceBase && near(spaceBase.x, 20));
});

// ---- model -----------------------------------------------------------------
test('newProject / newPattern shape', () => {
	const p = newProject('X');
	assert.equal(p.name, 'X');
	assert.equal(p.versions.length, 1);
	assert.equal(p.versions[0]?.status, 'draft');
	assert.equal(p.activeVersionId, p.versions[0]?.id);
	assert.deepEqual(Object.keys(activeVersion(p).resources).sort(), [
		'links',
		'notes',
		'variations',
		'yarns',
	]);
	const pat = newPattern('Sq');
	assert.equal(pat.construction, 'granny');
	assert.equal(pat.rounds.length, 2); // Start row + Round 1 from the outset
	assert.equal(pat.rounds[0]?.name, 'Start');
	assert.equal(pat.activeRound, pat.rounds[0]?.id); // opens on the Start row
});
test('normalizeProject tolerates junk + drops orphan stitches', () => {
	const p = normalizeProject({
		name: 'M',
		versions: [
			{
				patterns: [
					{
						construction: 'granny',
						rounds: [{ id: 'r1', name: 'R1' }],
						stitches: [
							{ type: 'dc', round: 'r1', x: 1, y: 2 },
							{ type: 'dc', round: 'GONE' },
							{ junk: true },
						],
					},
				],
			},
		],
	});
	assert.equal(activeVersion(p).patterns[0]?.stitches.length, 1);
});
test('normalizeProject gives a versionless input a fresh draft, carrying nothing over (pre-release: retired shapes are not upgraded)', () => {
	const p = normalizeProject({
		name: 'Retired shape',
		patterns: [
			{ type: 'granny', rounds: [{ id: 'r1', name: 'R1' }], stitches: [] },
		],
		resources: { yarns: [{ name: 'Cotton' }] },
	});
	assert.equal(p.versions.length, 1);
	assert.equal(p.versions[0]?.status, 'draft');
	assert.equal(activeVersion(p).patterns.length, 0);
	assert.equal(activeVersion(p).resources.yarns.length, 0);
});
test('projectToFile / projectFromFile round-trip', () => {
	const p = sampleProject();
	const file = projectToFile(p);
	assert.equal(file.format, 'threadwick-studio');
	assert.equal(file.version, FILE_VERSION);
	const back = projectFromFile(JSON.parse(JSON.stringify(file)))!;
	assert.equal(
		activeVersion(back).patterns[0]?.stitches.length,
		activeVersion(p).patterns[0]?.stitches.length,
	);
	assert.deepEqual(
		JSON.parse(JSON.stringify(back)),
		JSON.parse(JSON.stringify(p)),
	);
	// pre-release strictness: bare (unwrapped) projects are rejected
	assert.equal(projectFromFile(p), null);
});
test('normalizeProject repairs a start that shared a working row', () => {
	const p = normalizeProject({
		name: 'M',
		versions: [
			{
				patterns: [
					{
						construction: 'granny',
						rounds: [{ id: 'r1', name: 'Round 1' }],
						activeRound: 'r1',
						stitches: [
							{ id: 'ring', type: 'mr', round: 'r1', x: 0, y: 0 },
							{ id: 'd', type: 'dc', round: 'r1', origin: 'ring', x: 0, y: 0 },
						],
					},
				],
			},
		],
	});
	const pat = activeVersion(p).patterns[0]!;
	assert.equal(pat.rounds.length, 2);
	const r = pat.stitches.find((s) => s.type === 'mr')!;
	assert.equal(r.round, pat.rounds[0]?.id);
	assert.equal(
		pat.stitches.filter((s) => s.round === pat.rounds[0]?.id).length,
		1,
	);
});

// ---- instructions + render -------------------------------------------------
test('summarizeRound collapses runs', () => {
	const pat = newPattern('S');
	const rid = pat.rounds[0]?.id;
	const s = (id: string, type: StitchType, origin: string | null): Stitch => ({
		id,
		round: rid,
		type,
		origin,
		base: null as Base,
		x: 0,
		y: 0,
		rot: 0,
		len: null,
		color: null,
		mirror: false,
	});
	pat.stitches = [
		s('r', 'mr', null),
		s('1', 'dc', 'r'),
		s('2', 'dc', '1'),
		s('3', 'dc', '2'),
		s('4', 'ch', '3'),
		s('5', 'ch', '4'),
		s('6', 'dc', '5'),
	];
	assert.equal(summarizeRound(pat, rid), '3 dc, ch 2, dc');
});
test('chartToSVG emits a valid root with a legend', () => {
	const svg = chartToSVG(activeVersion(sampleProject()).patterns[0]!, {
		title: 'X',
	});
	assert.ok(svg.startsWith('<svg') && svg.trim().endsWith('</svg>'));
	assert.ok(svg.includes('Legend'));
});

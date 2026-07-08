// Pins the editor's migration/normalization invariants (src/model.ts) ahead of the
// Phase 7 reshape (ChartPattern/Project converging with @threadwick/types Pattern/Project).
// Every assertion here documents CURRENT behavior — including a couple of real gotchas
// (silent `any` coercion, a `resources: null` crash) — not aspirational behavior. If Phase 7
// changes one of these on purpose, update the fixture + assertion together, don't just delete
// the test. DOM-free, run with vitest. House style follows test/core.test.ts.

import assert from 'node:assert/strict';
import { test } from 'vitest';
import type { ChartPattern, Round, Stitch } from '../src';
import {
	ensureStartRow,
	FILE_VERSION,
	newPattern,
	normalizePattern,
	normalizeProject,
	projectFromFile,
	projectToFile,
} from '../src';

function stitch(
	overrides: Partial<Stitch> & Pick<Stitch, 'id' | 'type' | 'round'>,
): Stitch {
	return {
		origin: null,
		base: null,
		x: 0,
		y: 0,
		rot: 0,
		len: null,
		color: null,
		mirror: false,
		...overrides,
	};
}

function round(overrides: Partial<Round> & Pick<Round, 'id' | 'name'>): Round {
	return { ...overrides };
}

// ---- FILE_VERSION ------------------------------------------------------------
test('FILE_VERSION pins the current migration target', () => {
	// v4: maker-plane makePatterns + follow progress (TW-028). A bump here is a
	// deliberate migration-surface change — this test exists so it can't happen silently.
	assert.equal(FILE_VERSION, 4);
});

// ---- normalizePattern ---------------------------------------------------------
test('normalizePattern fills a bare object with fresh pattern defaults', () => {
	const pat = normalizePattern({});
	assert.equal(pat.type, 'granny');
	assert.equal(pat.name, 'Untitled pattern');
	assert.equal(pat.rounds.length, 2); // Start row + Round 1
	assert.equal(pat.rounds[0]?.name, 'Start');
	assert.equal(pat.stitches.length, 0);
});

test('normalizePattern falls back to granny for an unrecognized pattern type', () => {
	const pat = normalizePattern({ type: 'triangle' });
	assert.equal(pat.type, 'granny');
});

test('normalizePattern keeps an unrecognized stitch type verbatim as long as its round exists', () => {
	// normalizeStitch casts s.type as StitchType without validating it against
	// STITCHES — a malformed/future stitch type survives normalization untouched.
	const pat = normalizePattern({
		rounds: [{ id: 'r1', name: 'Round 1' }],
		activeRound: 'r1',
		stitches: [{ id: 's1', type: 'unknown-stitch', round: 'r1', x: 5, y: 6 }],
	});
	assert.equal(pat.stitches.length, 1);
	assert.equal(pat.stitches[0]?.type, 'unknown-stitch');
});

test('normalizePattern drops stitches with a missing/unknown/malformed round (orphans)', () => {
	const pat = normalizePattern({
		rounds: [{ id: 'r1', name: 'R1' }],
		stitches: [
			{ type: 'dc', round: 'r1', x: 1, y: 2 }, // kept
			{ type: 'dc', round: 'GONE' }, // unknown round -> dropped
			{ type: 'dc' }, // no round at all -> dropped
			{ junk: true }, // no `type` -> normalizeStitch returns null
			null,
			42,
		],
	});
	assert.equal(pat.stitches.length, 1);
	assert.equal(pat.stitches[0]?.x, 1);
});

test('normalizePattern normalizes round followMarks: corners stringified, invalid repeats dropped, times floored', () => {
	const pat = normalizePattern({
		rounds: [
			{
				id: 'r1',
				name: 'Round 1',
				followMarks: {
					corners: [1, 'a', null],
					repeats: [
						{ fromStitchId: 'x', toStitchId: 'y', times: 3.7 },
						{ fromStitchId: null, toStitchId: 'z' }, // missing fromStitchId -> dropped
						{ fromStitchId: 'a', toStitchId: 'b' }, // no times -> stays undefined
					],
				},
			},
		],
	});
	// r1 has no stitches, so ensureStartRow renames it to "Start" in place rather than
	// inserting a fresh row in front of it (see the ensureStartRow tests below) — the
	// followMarks travel with it.
	const marks = pat.rounds[0]?.followMarks;
	assert.deepEqual(marks?.corners, ['1', 'a', 'null']);
	assert.equal(marks?.repeats.length, 2);
	assert.equal(marks?.repeats[0]?.times, 3);
	assert.equal(marks?.repeats[1]?.times, undefined);
});

test('normalizePattern drops followMarks entirely once corners and repeats are both empty', () => {
	const pat = normalizePattern({
		rounds: [
			{ id: 'r1', name: 'R1', followMarks: { corners: [], repeats: [] } },
		],
	});
	assert.equal(pat.rounds[0]?.followMarks, undefined);
});

// ---- ensureStartRow ------------------------------------------------------------
test('ensureStartRow leaves an already-correct Start row untouched', () => {
	const pat = newPattern('P');
	const r0 = pat.rounds[0]!;
	pat.stitches = [stitch({ id: 'ring', type: 'mr', round: r0.id })];
	const idsBefore = pat.rounds.map((r) => r.id);
	ensureStartRow(pat);
	assert.deepEqual(
		pat.rounds.map((r) => r.id),
		idsBefore,
	);
	assert.equal(pat.rounds[0]?.name, 'Start');
});

test('ensureStartRow moves a start row that is alone but not first to the front', () => {
	const r1 = round({ id: 'r1', name: 'Round 1' });
	const r2 = round({ id: 'r2', name: 'Somewhere else' });
	const pat: ChartPattern = {
		id: 'p1',
		type: 'granny',
		name: 'P',
		start: null,
		rounds: [r1, r2],
		activeRound: 'r1',
		stitches: [
			stitch({ id: 'a', type: 'dc', round: 'r1' }),
			stitch({ id: 'ring', type: 'mr', round: 'r2' }), // alone in r2, but r2 isn't first
		],
		view: { scale: 1, panX: 0, panY: 0 },
		createdAt: 'a',
		updatedAt: 'b',
	};
	ensureStartRow(pat);
	assert.equal(pat.rounds[0]?.id, 'r2'); // moved to the front
	assert.equal(pat.rounds[0]?.name, 'Start');
	assert.equal(pat.rounds[1]?.id, 'r1'); // original order otherwise preserved
});

test('ensureStartRow gives a start stitch its own dedicated row when it shares one', () => {
	const pat: ChartPattern = {
		id: 'p1',
		type: 'granny',
		name: 'P',
		start: null,
		rounds: [round({ id: 'r1', name: 'Round 1' })],
		activeRound: 'r1',
		stitches: [
			stitch({ id: 'ring', type: 'mr', round: 'r1' }),
			stitch({ id: 'd', type: 'dc', round: 'r1', origin: 'ring' }),
		],
		view: { scale: 1, panX: 0, panY: 0 },
		createdAt: 'a',
		updatedAt: 'b',
	};
	ensureStartRow(pat);
	assert.equal(pat.rounds.length, 2);
	const startStitch = pat.stitches.find((s) => s.type === 'mr')!;
	assert.equal(startStitch.round, pat.rounds[0]?.id);
	assert.notEqual(pat.rounds[0]?.id, 'r1'); // a brand-new row, not the shared one
	assert.equal(
		pat.stitches.filter((s) => s.round === pat.rounds[0]?.id).length,
		1,
	);
});

test('ensureStartRow synthesizes Start + Round 1 from nothing and resets a dangling activeRound', () => {
	const pat: ChartPattern = {
		id: 'p1',
		type: 'granny',
		name: 'P',
		start: null,
		rounds: [],
		activeRound: 'does-not-exist',
		stitches: [],
		view: { scale: 1, panX: 0, panY: 0 },
		createdAt: 'a',
		updatedAt: 'b',
	};
	ensureStartRow(pat);
	assert.equal(pat.rounds.length, 2);
	assert.equal(pat.rounds[0]?.name, 'Start');
	assert.equal(pat.rounds[1]?.name, 'Round 1');
	assert.equal(pat.activeRound, pat.rounds[0]?.id);
});

// ---- normalizeProject: bare / legacy shapes ------------------------------------
test('normalizeProject fills a bare object with fresh project defaults', () => {
	const prj = normalizeProject({});
	assert.equal(prj.name, 'Untitled project');
	assert.equal(prj.versions.length, 1);
	assert.equal(prj.versions[0]?.status, 'draft');
	assert.equal(prj.activeVersionId, prj.versions[0]?.id);
	assert.equal(prj.makerStatus, undefined);
});

test('normalizeProject does NOT upgrade the retired pre-versions shape — it yields a fresh draft (pre-release policy)', () => {
	// The pre-FILE_VERSION-3 shape (patterns/resources directly on the project)
	// is retired; until release there is no compatibility window, so nothing
	// from it carries over.
	const prj = normalizeProject({
		name: 'Retired shape',
		patterns: [
			{
				id: 'p1',
				type: 'granny',
				name: 'Old pattern',
				rounds: [{ id: 'r1', name: 'R1' }],
				stitches: [{ type: 'dc', round: 'r1', x: 1, y: 2 }],
			},
		],
		resources: { yarns: [{ name: 'Cotton' }] },
		createdAt: '2020-01-01T00:00:00.000Z',
		updatedAt: '2020-01-02T00:00:00.000Z',
	});
	assert.equal(prj.versions.length, 1);
	assert.equal(prj.versions[0]?.status, 'draft');
	assert.equal(prj.versions[0]?.patterns.length, 0);
	assert.equal(prj.versions[0]?.resources.yarns.length, 0);
	// scalar fields still parse — they are part of the current shape too
	assert.equal(prj.createdAt, '2020-01-01T00:00:00.000Z');
});

test('normalizeProject ignores the retired patternIds and top-level patterns fields', () => {
	const prj = normalizeProject({
		name: 'Make',
		versions: [
			{
				label: 'v1',
				status: 'draft',
				patterns: [{ id: 'pat1', type: 'granny', name: 'Sq' }],
			},
		],
		patternIds: ['pat1'],
		patterns: [
			{ id: 'ref1', label: 'ExtRef', source: 'blog', url: 'http://x' },
		],
	});
	assert.equal(prj.makePatterns, undefined);
});

test('normalizeProject resolves a missing makePatterns label from the live pattern, blank when unresolved', () => {
	const prj = normalizeProject({
		name: 'Make',
		versions: [
			{
				label: 'v1',
				status: 'draft',
				patterns: [{ id: 'pat1', type: 'granny', name: 'Sq' }],
			},
		],
		makePatterns: [
			{ source: 'threadwick', patternId: 'pat1' },
			{ source: 'threadwick', patternId: 'pat-missing' },
		],
	});
	assert.equal(prj.makePatterns?.length, 2);
	assert.equal(prj.makePatterns?.[0]?.label, 'Sq'); // resolved from the live pattern
	assert.equal(prj.makePatterns?.[1]?.label, ''); // unresolved id -> blank label, not a throw
	assert.equal(prj.makerStatus, 'draft');
});

test('normalizeProject passes a non-string name through unvalidated', () => {
	// newProject does `name || 'Untitled project'` — a truthy non-string survives as-is.
	const prj = normalizeProject({ name: 123 });
	assert.equal(prj.name, 123);
});

// ---- normalizeVersion / enforceSinglePublished (exercised through normalizeProject —
// both are module-private) ------------------------------------------------------------
test('normalizeProject falls back a non-string/blank version label to vN, and an invalid status to draft', () => {
	const prj = normalizeProject({
		name: 'M',
		versions: [{ label: 42, status: 'bogus' }],
	});
	assert.equal(prj.versions[0]?.label, 'v1');
	assert.equal(prj.versions[0]?.status, 'draft');
});

test('normalizeProject infers publishedAt from updatedAt when a version is published without one', () => {
	const prj = normalizeProject({
		name: 'PubAt',
		versions: [{ label: 'v1', status: 'published' }],
	});
	assert.equal(prj.versions[0]?.publishedAt, prj.versions[0]?.updatedAt);
});

test('normalizeProject throws when a version carries resources: null (default params do not apply to null)', () => {
	// A real gotcha: `normalizeResources(r: any = {})` only defaults on `undefined`,
	// not `null`, so an explicit null crashes instead of being tolerated like every
	// other malformed field in this module. Pinned so Phase 7 has to make it a
	// deliberate choice either way, not an incidental fix.
	assert.throws(() => {
		normalizeProject({
			name: 'M',
			versions: [{ label: 'v1', resources: null }],
		});
	}, TypeError); // pin the ACCIDENTAL crash specifically — a deliberate Phase 7 validation error would (rightly) fail this
});

test('normalizeProject enforces at most one Published version, demoting all but the most recent to Outdated', () => {
	const prj = normalizeProject({
		name: 'Dup',
		versions: [
			{
				id: 'v1',
				label: 'v1',
				status: 'published',
				publishedAt: '2024-01-01T00:00:00.000Z',
			},
			{
				id: 'v2',
				label: 'v2',
				status: 'published',
				publishedAt: '2024-02-01T00:00:00.000Z',
			},
		],
	});
	const v1 = prj.versions.find((v) => v.id === 'v1');
	const v2 = prj.versions.find((v) => v.id === 'v2');
	assert.equal(v1?.status, 'outdated');
	assert.equal(v2?.status, 'published'); // most recently published wins
	assert.equal(prj.activeVersionId, 'v2'); // falls back to the (now sole) published version
});

test('normalizeProject falls back an invalid activeVersionId to published, then draft, then the first version', () => {
	const prj = normalizeProject({
		name: 'Fallback',
		activeVersionId: 'nope',
		versions: [
			{ id: 'v1', label: 'v1', status: 'outdated' },
			{ id: 'v2', label: 'v2', status: 'draft' },
		],
	});
	assert.equal(prj.activeVersionId, 'v2'); // no published version -> the draft
});

// ---- makerStatus inference ------------------------------------------------------
test('normalizeProject infers makerStatus from makePatterns progress, but unitsDone: 0 does not count as in-progress', () => {
	// `makePatterns?.some((r) => r.progress?.unitsDone)` is a truthiness check, so an
	// explicit 0 is indistinguishable from "no progress yet" and falls through to 'draft'.
	const zero = normalizeProject({
		name: 'M',
		makePatterns: [
			{ id: 'r1', label: 'A', source: 'blog', progress: { unitsDone: 0 } },
		],
	});
	assert.equal(zero.makerStatus, 'draft');

	const some = normalizeProject({
		name: 'M',
		makePatterns: [
			{ id: 'r1', label: 'A', source: 'blog', progress: { unitsDone: 2 } },
		],
	});
	assert.equal(some.makerStatus, 'in-progress');

	const none = normalizeProject({ name: 'M' });
	assert.equal(none.makerStatus, undefined);
});

test('normalizeProject ignores an invalid explicit makerStatus and falls back to inference', () => {
	const prj = normalizeProject({
		name: 'M',
		makerStatus: 'bogus',
		makePatterns: [{ id: 'r1', label: 'A', source: 'blog' }],
	});
	assert.equal(prj.makerStatus, 'draft');
});

// ---- projectToFile / projectFromFile -------------------------------------------
test('projectToFile stamps the current FILE_FORMAT and FILE_VERSION', () => {
	const prj = normalizeProject({ name: 'X' });
	const file = projectToFile(prj);
	assert.equal(file.format, 'threadwick-studio');
	assert.equal(file.version, FILE_VERSION);
	assert.equal(file.project.id, prj.id);
});

test('projectFromFile rejects input with neither a `project` wrapper nor a recognizable bare project', () => {
	assert.equal(projectFromFile(null), null);
	assert.equal(projectFromFile('nope'), null);
	assert.equal(projectFromFile(42), null);
	assert.equal(projectFromFile({ garbage: true }), null);
});

test('projectFromFile rejects bare projects and non-current versions (pre-release: envelope with the current FILE_VERSION only)', () => {
	const prj = normalizeProject({ name: 'Bare' });
	assert.equal(projectFromFile(prj), null);
	const stale = { ...projectToFile(prj), version: 3 };
	assert.equal(projectFromFile(stale), null);
});

test('full export -> import round-trip is a deep-equal identity for an already-normalized project', () => {
	const legacy = normalizeProject({
		name: 'Round-trip',
		versions: [
			{
				label: 'v1',
				status: 'draft',
				patterns: [
					{
						id: 'p1',
						type: 'granny',
						name: 'Pattern',
						rounds: [{ id: 'r1', name: 'R1' }],
						stitches: [{ id: 's1', type: 'dc', round: 'r1', x: 1, y: 2 }],
					},
				],
				resources: { yarns: [{ name: 'Cotton' }] },
			},
		],
		makePatterns: [{ source: 'threadwick', patternId: 'p1' }],
	});
	const file = projectToFile(legacy);
	// round-trip through JSON, like a real file save/load would
	const reloaded = projectFromFile(JSON.parse(JSON.stringify(file)));
	assert.ok(reloaded);
	assert.deepEqual(
		JSON.parse(JSON.stringify(reloaded)),
		JSON.parse(JSON.stringify(legacy)),
	);
});

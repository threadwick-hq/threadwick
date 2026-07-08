import assert from 'node:assert/strict';
import type { Pattern } from '@threadwick/types';
import { describe, test } from 'vitest';
import { deriveRecents, patternEditedAt } from '../src/recents';
import { sampleProject } from '../src/sample';
import { sampleWorkbenchPattern } from '../src/sample-workbench-pattern';
import type { Project } from '../src/types';

const NOW = Date.parse('2026-07-08T12:00:00Z');

function hoursAgo(hours: number): string {
	return new Date(NOW - hours * 60 * 60 * 1000).toISOString();
}

function patternEditedAgo(hours: number, name: string): Pattern {
	const base = sampleWorkbenchPattern();
	const versioning = base.versioning;
	assert.ok(versioning, 'the sample workbench pattern carries versioning');
	return {
		...base,
		id: `pat-${name}`,
		overview: { ...base.overview, name },
		versioning: {
			...versioning,
			versions: versioning.versions.map((version, i) => ({
				...version,
				// only the newest version's edit should count; keep older ones older
				updatedAt: hoursAgo(hours + (versioning.versions.length - 1 - i) * 100),
			})),
		},
	};
}

function projectWorkedAgo(hours: number, name: string): Project {
	const base = sampleProject();
	return {
		...base,
		id: `prj-${name}`,
		name,
		updatedAt: hoursAgo(hours + 500), // stale edit; lastWorkedAt should win
		lastWorkedAt: hoursAgo(hours),
		makePatterns: [],
	};
}

describe('recents read model', () => {
	test('lead is the single most-recent thing across both kinds, shelf follows in order', () => {
		const model = deriveRecents(
			[patternEditedAgo(9, 'Sunburst'), patternEditedAgo(80, 'Hexagon')],
			[projectWorkedAgo(48, 'Blanket')],
			{ now: NOW },
		);
		assert.equal(model.lead?.title, 'Sunburst');
		assert.deepEqual(
			model.shelf.map((r) => r.title),
			['Blanket', 'Hexagon'],
		);
	});

	test('states carry the kind verb and plain-language time', () => {
		const model = deriveRecents(
			[patternEditedAgo(9, 'Sunburst')],
			[projectWorkedAgo(48, 'Blanket')],
			{ now: NOW },
		);
		assert.equal(model.lead?.state, 'Edited 9 hours ago');
		assert.equal(model.shelf[0]?.state, 'Worked on 2 days ago');
	});

	test('a just-now edit composes in lowercase', () => {
		const model = deriveRecents([patternEditedAgo(0, 'Fresh')], [], {
			now: NOW,
		});
		assert.equal(model.lead?.state, 'Edited just now');
	});

	test('project activity falls back to updatedAt when never worked', () => {
		const project = {
			...projectWorkedAgo(48, 'Untouched'),
			lastWorkedAt: undefined,
			updatedAt: hoursAgo(3),
		};
		const model = deriveRecents([], [project], { now: NOW });
		assert.equal(model.lead?.state, 'Worked on 3 hours ago');
	});

	test('shelfSize bounds the shelf; extras drop off the end', () => {
		const patterns = [1, 2, 3, 4, 5].map((h) => patternEditedAgo(h, `P${h}`));
		const model = deriveRecents(patterns, [], { now: NOW, shelfSize: 2 });
		assert.equal(model.lead?.title, 'P1');
		assert.deepEqual(
			model.shelf.map((r) => r.title),
			['P2', 'P3'],
		);
	});

	test('empty collections yield an empty model', () => {
		const model = deriveRecents([], [], { now: NOW });
		assert.equal(model.lead, undefined);
		assert.deepEqual(model.shelf, []);
	});

	test('versioning-less patterns and invalid dates are excluded', () => {
		const versionless: Pattern = {
			...sampleWorkbenchPattern(),
			versioning: undefined,
		};
		const invalid = projectWorkedAgo(1, 'Broken');
		invalid.lastWorkedAt = 'not-a-date';
		invalid.updatedAt = 'also-not-a-date';
		const model = deriveRecents([versionless], [invalid], { now: NOW });
		assert.equal(model.lead, undefined);
		assert.deepEqual(model.shelf, []);
	});

	test('patternEditedAt picks the newest version edit', () => {
		const pattern = patternEditedAgo(9, 'Sunburst');
		assert.equal(patternEditedAt(pattern), hoursAgo(9));
	});
});

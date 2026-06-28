import assert from 'node:assert/strict';
import { describe, test } from 'vitest';

import {
	formatDurationMs,
	formatRelativeAgo,
	projectOverviewKeyFacts,
	projectOverviewMaterials,
} from '../src/project-overview';
import { sampleProject } from '../src/sample';
import { activeVersion } from '../src/model';

describe('project overview helpers', () => {
	test('formats duration and relative time', () => {
		assert.equal(formatDurationMs(14 * 3600 * 1000 + 20 * 60 * 1000), '14 h 20 m');
		const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString();
		assert.match(formatRelativeAgo(fiveHoursAgo), /5 hours ago/);
	});

	test('sample project exposes materials with from-stash tags', () => {
		const prj = sampleProject();
		const materials = projectOverviewMaterials(prj);
		assert.ok(materials.length >= 3);
		assert.ok(materials.some((m) => m.fromStash && m.label.includes('Cotton DK')));
		assert.ok(materials.some((m) => m.acquired === false));
	});

	test('key facts derive from sample progress', () => {
		const prj = sampleProject();
		const resolve = (id: string) =>
			activeVersion(prj).patterns.find((p) => p.id === id);
		const facts = projectOverviewKeyFacts(prj, resolve);
		assert.ok(facts.some((f) => f.label === 'Last worked on'));
		assert.ok(facts.some((f) => f.label === 'Time logged'));
		assert.ok(facts.some((f) => f.label === 'Units left'));
	});
});

import { describe, expect, it } from 'vitest';
import {
	createPatternDraft,
	patternMeetsPublishFloor,
	patternPublishAction,
	patternPublishActionLabel,
	patternPublishFloorMissing,
	patternQualityChecks,
	publishPatternVersion,
	remixPattern,
	setActivePatternVersion,
} from '../src/pattern-versioning';
import { sampleWorkbenchPattern } from '../src/sample-workbench-pattern';

describe('pattern versioning helpers', () => {
	const pattern = sampleWorkbenchPattern();

	it('derives contextual publish action labels', () => {
		expect(patternPublishAction(pattern)).toBe('publish-version');
		expect(patternPublishActionLabel('publish-version')).toBe(
			'Publish version',
		);

		const privatePattern = {
			...pattern,
			versioning: {
				...pattern.versioning!,
				visibility: 'private' as const,
			},
		};
		expect(patternPublishAction(privatePattern)).toBe('publish-pattern');

		const noDraft = {
			...pattern,
			versioning: {
				visibility: 'published' as const,
				activeVersionId: 'ver-1',
				versions: [
					{
						id: 'ver-1',
						label: 'v1',
						status: 'published' as const,
						createdAt: '',
						updatedAt: '',
					},
				],
			},
		};
		expect(patternPublishAction(noDraft)).toBe('new-draft');
	});

	it('switches active version', () => {
		const next = setActivePatternVersion(pattern, 'ver-1');
		expect(next.versioning?.activeVersionId).toBe('ver-1');
	});

	it('publishes the active draft and supersedes the prior published version', () => {
		const published = publishPatternVersion(pattern);
		expect(published.versioning?.visibility).toBe('published');
		const draft = published.versioning?.versions.find((v) => v.id === 'ver-4');
		expect(draft?.status).toBe('published');
		expect(draft?.publishedAt).toBeTruthy();
	});

	it('creates a new draft when none exists', () => {
		const publishedOnly = publishPatternVersion(pattern);
		const withDraft = createPatternDraft(publishedOnly);
		expect(
			withDraft.versioning?.versions.some((v) => v.status === 'draft'),
		).toBe(true);
		expect(patternPublishAction(withDraft)).toBe('publish-version');
	});

	it('remixes into a private pattern with lineage', () => {
		const remixed = remixPattern(pattern);
		expect(remixed.id).not.toBe(pattern.id);
		expect(remixed.versioning?.visibility).toBe('private');
		expect(remixed.lineage?.remixedFromPatternId).toBe(pattern.id);
		expect(remixed.overview.name).toContain('(remix)');
	});
});

describe('pattern quality checks', () => {
	const pattern = sampleWorkbenchPattern();

	it('marks floor items present on the seed pattern', () => {
		const checks = patternQualityChecks(pattern);
		expect(checks.find((c) => c.id === 'artifact')?.present).toBe(true);
		expect(checks.find((c) => c.id === 'photo')?.present).toBe(true);
		expect(checks.find((c) => c.id === 'materials-gauge')?.present).toBe(true);
		expect(checks.find((c) => c.id === 'difficulty')?.present).toBe(true);
		expect(patternMeetsPublishFloor(pattern)).toBe(true);
		expect(patternPublishFloorMissing(pattern)).toHaveLength(0);
	});

	it('gently gates publish when floor items are missing', () => {
		const sparse = {
			...pattern,
			overview: { name: 'Untitled', gallery: [] },
			components: [],
			materials: [],
			notes: [],
		};
		expect(patternMeetsPublishFloor(sparse)).toBe(false);
		expect(patternPublishFloorMissing(sparse)).toEqual(
			expect.arrayContaining([
				'Chart or written instructions',
				'Finished-object photo',
				'Materials & gauge',
				'Difficulty',
			]),
		);
	});

	it('never treats optional items as floor failures', () => {
		const checks = patternQualityChecks(pattern);
		const optional = checks.filter((c) => c.tier === 'optional');
		expect(optional.length).toBeGreaterThan(0);
		expect(optional.some((c) => !c.present)).toBe(true);
		expect(patternMeetsPublishFloor(pattern)).toBe(true);
	});
});

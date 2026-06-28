import type { Pattern } from '@threadwick/types';

/** Seed workbench pattern for pattern-interior smoke tests (§4.2 mockup). */
export function sampleWorkbenchPattern(): Pattern {
	const now = new Date().toISOString();
	return {
		id: 'pat-spring-granny',
		craft: 'crochet',
		overview: {
			name: 'Spring granny blanket',
			summary:
				'A soft cotton throw in pastel granny squares — my first big blanket, written up so I can make it again.',
			gallery: [
				{ src: '', alt: 'Finished blanket detail' },
				{ src: '', alt: 'Square layout' },
				{ src: '', alt: 'Yarn palette' },
			],
			skillLevel: 'intermediate',
		},
		components: [
			{
				id: 'comp-flower',
				name: 'Flower square',
				kind: 'motif',
				artifacts: [
					{
						type: 'chart',
						id: 'art-flower-chart',
						data: { id: 'chart-flower' },
					},
					{
						type: 'written',
						id: 'art-flower-written',
						body: 'Round 1–6 written instructions for the flower square.',
					},
				],
			},
			{
				id: 'comp-leaves',
				name: 'Leaves square',
				kind: 'motif',
				artifacts: [
					{
						type: 'chart',
						id: 'art-leaves-chart',
						data: { id: 'chart-leaves' },
					},
					{
						type: 'written',
						id: 'art-leaves-written',
						body: 'Round 1–6 written instructions for the leaves square.',
					},
				],
			},
		],
		materials: [
			{
				id: 'mat-yarn-1',
				kind: 'yarn',
				label: 'Cotton 8/4 · Drops',
				weight: 'DK',
			},
			{
				id: 'mat-yarn-2',
				kind: 'yarn',
				label: 'Pastel mix',
				weight: 'DK',
			},
			{
				id: 'mat-hook',
				kind: 'hook',
				label: 'Crochet hook',
				weight: '3.0 mm',
			},
		],
		tutorials: [
			{
				id: 'tut-1',
				kind: 'technique',
				label: 'Magic ring tutorial',
				url: 'https://example.com/magic-ring',
				provider: 'youtube',
			},
			{
				id: 'tut-2',
				kind: 'project',
				label: 'Granny square basics',
				url: 'https://example.com/granny',
				provider: 'youtube',
			},
		],
		stitches: [
			{
				id: 'st-puff',
				kind: 'special',
				abbr: 'puff',
				name: 'Puff stitch',
				definition:
					'Yarn over, pull up a loop three times in the same stitch, yarn over and pull through all loops.',
			},
		],
		notes: [
			{
				id: 'note-gauge',
				kind: 'gauge',
				title: 'Gauge & hook note',
				body: '1 sq = 10 cm with 3.0 mm hook',
			},
		],
		variations: [],
		workingCopy: { branch: 'main', dirty: false },
		versioning: {
			visibility: 'published',
			activeVersionId: 'ver-4',
			versions: [
				{
					id: 'ver-1',
					label: 'v1',
					status: 'outdated',
					createdAt: now,
					updatedAt: now,
					publishedAt: now,
				},
				{
					id: 'ver-4',
					label: 'v4',
					status: 'draft',
					createdAt: now,
					updatedAt: now,
				},
			],
		},
	};
}

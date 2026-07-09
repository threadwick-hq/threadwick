import type { Pattern } from '@threadwick/types';
import type { PatternListing } from './pattern-view-mode';

/** Marketplace demo pattern for view-mode smoke tests (§4.4 mockup). */
export function sampleMarketplaceViewPattern(): Pattern {
	const now = new Date().toISOString();
	return {
		id: 'pat-wildflower-granny',
		craft: 'crochet',
		overview: {
			name: 'Wildflower granny square',
			summary:
				'A bright beginner-friendly granny square — quick to memorise and endlessly repeatable. Great for blankets, bags and scrap-busting.',
			gallery: [
				{ src: '', alt: 'Finished square on a blanket' },
				{ src: '', alt: 'Close-up of flower centre' },
				{ src: '', alt: 'Yarn palette' },
			],
			skillLevel: 'beginner',
			designer: { name: 'Mara Chen', url: 'https://example.com/mara' },
		},
		components: [
			{
				id: 'comp-flower',
				name: 'Flower square',
				kind: 'motif',
				artifacts: [
					{
						type: 'chart',
						id: 'art-chart',
						data: {
							id: 'chart-wildflower',
							construction: 'granny',
							start: null,
							rounds: [],
							activeRound: '',
							stitches: [],
							view: { scale: 1, panX: 0, panY: 0 },
						},
					},
					{
						type: 'written',
						id: 'art-written',
						body: 'Round 1–5 written instructions for the wildflower granny square.',
					},
				],
			},
		],
		materials: [
			{
				id: 'mat-yarn',
				kind: 'yarn',
				label: 'Any · DK',
				weight: 'DK',
			},
			{
				id: 'mat-hook',
				kind: 'hook',
				label: 'Crochet hook',
				weight: '4.0 mm',
			},
		],
		tutorials: [],
		stitches: [
			{
				id: 'st-dc',
				kind: 'abbreviation',
				abbr: 'dc',
				name: 'Double crochet',
				definition: 'US double crochet / UK treble.',
			},
		],
		notes: [
			{
				id: 'note-gauge',
				kind: 'gauge',
				title: 'Gauge',
				body: 'One square = 12 cm with 4.0 mm hook',
			},
		],
		variations: [],
		workingCopy: { branch: 'main', dirty: false },
		versioning: {
			visibility: 'published',
			activeVersionId: 'ver-3',
			versions: [
				{
					id: 'ver-3',
					label: 'v3',
					status: 'published',
					createdAt: now,
					updatedAt: now,
					publishedAt: now,
				},
			],
		},
	};
}

export function sampleMarketplaceListing(): PatternListing {
	return {
		patternId: 'pat-wildflower-granny',
		priceCents: 0,
		currency: 'USD',
		rating: 4.8,
		reviewCount: 312,
		handle: '@mara_makes',
		followerCount: 1240,
		category: 'blankets',
	};
}

export function samplePaidMarketplaceListing(): PatternListing {
	return {
		...sampleMarketplaceListing(),
		priceCents: 599,
	};
}

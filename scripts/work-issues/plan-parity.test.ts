import { describe, expect, it } from 'vitest';
// The hooks' shared JS implementation (typed via lib/plan.d.mts).
import { planFilled } from '../../.claude/hooks/lib/plan.mjs';
import { isPlanFilled, newBody, setSection } from './body';

const TEMPLATE = newBody({
	context: 'Some context.',
	scope: 'In: things. Out: other things.',
	acceptance: ['it works'],
});

function withPlan(content: string): string {
	const updated = setSection(TEMPLATE, 'Plan', content);
	if (!updated.ok) throw new Error(`fixture setup failed: ${updated.error}`);
	return updated.value;
}

/**
 * The hooks carry a lenient line-scanning reimplementation of the CLI's
 * isPlanFilled (they cannot import TS). This suite pins the two to identical
 * verdicts on every work:v1-shaped body the workflow actually produces.
 */
describe('planFilled (hooks) parity with isPlanFilled (CLI)', () => {
	const cases: readonly [name: string, body: string][] = [
		['fresh template (placeholder plan)', TEMPLATE],
		['filled plan', withPlan('Approach: do the thing.\n1. step one')],
		['whitespace-only plan', withPlan('   \n\t')],
		[
			'plan that starts with the placeholder prefix',
			withPlan('_Filled later_'),
		],
		[
			'filled plan with a following section',
			withPlan('Approach: ship it.\n\nRisks: none.'),
		],
		['empty body', ''],
		['body without a Plan heading', '<!-- work:v1 -->\n## Context\nhello'],
	];

	for (const [name, body] of cases) {
		it(`agrees on: ${name}`, () => {
			expect(planFilled(body)).toBe(isPlanFilled(body));
		});
	}

	it('documents the known divergence: marker-less bodies', () => {
		// The CLI requires the work:v1 marker before it parses sections; the hooks
		// deliberately do not (they must fail open on any body shape). This case
		// is the boundary of the parity guarantee, asserted so a future change to
		// either side surfaces here.
		const markerless = '## Plan\nApproach: real content.';
		expect(planFilled(markerless)).toBe(true);
		expect(isPlanFilled(markerless)).toBe(false);
	});
});

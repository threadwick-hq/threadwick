import { describe, expect, it } from 'vitest';
import {
	patternOverviewKeyFacts,
	patternOverviewStatusLabel,
	patternVisibilityLabel,
	patternWhatsInsideItems,
} from '../src/pattern-overview';
import { sampleWorkbenchPattern } from '../src/sample-workbench-pattern';

describe('pattern overview helpers', () => {
	const pattern = sampleWorkbenchPattern();

	it('derives visibility and status labels', () => {
		expect(patternVisibilityLabel(pattern)).toBe('Published');
		expect(patternOverviewStatusLabel(pattern)).toBe('Published · editing v4');
	});

	it('builds key facts from overview and materials', () => {
		const facts = patternOverviewKeyFacts(pattern);
		expect(facts.some((f) => f.label === 'Difficulty' && f.value === 'Intermediate')).toBe(
			true,
		);
		expect(facts.some((f) => f.label === 'Components' && f.value === '2')).toBe(true);
		expect(facts.some((f) => f.label === 'Hook')).toBe(true);
	});

	it('builds navigable whats-inside rows', () => {
		const items = patternWhatsInsideItems(pattern.id, pattern);
		expect(items).toHaveLength(2);
		expect(items[0]?.href).toBe(`/studio/patterns/${pattern.id}/components`);
		expect(items[1]?.href).toBe(`/studio/patterns/${pattern.id}/materials/yarns`);
	});
});

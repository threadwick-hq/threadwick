import { describe, expect, it } from 'vitest';
import type { GlossaryTerm } from '../src/glossary';
import type { SourceEntry, SourceNamespace } from '../src/schema';
import type { LintTarget } from './lint-rules';
import { lintNamespace } from './lint-rules';

function ns(pairs: [string, SourceEntry][]): SourceNamespace {
	return Object.fromEntries(pairs);
}

function values(pairs: [string, string][]): Record<string, string> {
	return Object.fromEntries(pairs);
}

function glossary(
	pairs: [string, GlossaryTerm][],
): Record<string, GlossaryTerm> {
	return Object.fromEntries(pairs);
}

function rulesFor(target: LintTarget): string[] {
	return lintNamespace(target).map((violation) => violation.rule);
}

describe('lintNamespace', () => {
	it('passes a correct Polish namespace', () => {
		const source = ns([
			[
				'count_patterns',
				{
					text: '{count, plural, one {# pattern} other {# patterns}}',
					context: 'count',
					icu: true,
					placeholders: { count: 'number' },
					glossaryRefs: ['pattern'],
				},
			],
			[
				'palette_sc',
				{
					text: 'Single crochet',
					context: 'palette',
					maxLength: 18,
					glossaryRefs: ['single_crochet_us'],
				},
			],
		]);
		const target: LintTarget = {
			locale: 'pl',
			namespace: 'common',
			source,
			translated: values([
				[
					'count_patterns',
					'{count, plural, one {# wzór} few {# wzory} many {# wzorów} other {# wzoru}}',
				],
				['palette_sc', 'Półsłupek'],
			]),
			glossary: glossary([
				['pattern', { source: 'pattern', translations: { pl: 'wzór' } }],
				[
					'single_crochet_us',
					{ source: 'single crochet', translations: { pl: 'półsłupek' } },
				],
			]),
			isSource: false,
		};
		expect(rulesFor(target)).toEqual([]);
	});

	it('flags a bare numeric placeholder that needs an ICU plural', () => {
		const source = ns([
			[
				'work_sc',
				{
					text: 'Work {count} single crochet',
					context: 'instruction',
					placeholders: { count: 'number' },
				},
			],
		]);
		const rules = rulesFor({
			locale: 'en',
			namespace: 'common',
			source,
			translated: values([['work_sc', 'Work {count} single crochet']]),
			glossary: glossary([]),
			isSource: true,
		});
		expect(rules).toContain('BARE_COUNT_NEEDS_ICU');
	});

	it('flags a dropped placeholder', () => {
		const source = ns([
			[
				'greet',
				{
					text: 'Hi {name}',
					context: 'greeting',
					placeholders: { name: 'string' },
				},
			],
		]);
		const rules = rulesFor({
			locale: 'pl',
			namespace: 'common',
			source,
			translated: values([['greet', 'Cześć']]),
			glossary: glossary([]),
			isSource: false,
		});
		expect(rules).toContain('PLACEHOLDER_PARITY');
	});

	it('flags missing Polish plural categories', () => {
		const source = ns([
			[
				'count_x',
				{
					text: '{count, plural, one {# x} other {# x}}',
					context: 'count',
					icu: true,
					placeholders: { count: 'number' },
				},
			],
		]);
		const rules = rulesFor({
			locale: 'pl',
			namespace: 'common',
			source,
			translated: values([
				['count_x', '{count, plural, one {# x} other {# x}}'],
			]),
			glossary: glossary([]),
			isSource: false,
		});
		expect(rules).toContain('ICU_LOCALE_CATEGORIES');
	});

	it('flags a missing glossary term', () => {
		const source = ns([
			[
				'empty',
				{
					text: 'No patterns yet',
					context: 'empty',
					glossaryRefs: ['pattern'],
				},
			],
		]);
		const rules = rulesFor({
			locale: 'pl',
			namespace: 'common',
			source,
			translated: values([['empty', 'Brak na razie']]),
			glossary: glossary([
				['pattern', { source: 'pattern', translations: { pl: 'wzór' } }],
			]),
			isSource: false,
		});
		expect(rules).toContain('GLOSSARY_TERM');
	});

	it('flags an ICU plural dropped to a flat string', () => {
		const source = ns([
			[
				'count_x',
				{
					text: '{count, plural, one {{count} pattern} other {{count} patterns}}',
					context: 'count',
					icu: true,
					placeholders: { count: 'number' },
				},
			],
		]);
		const rules = rulesFor({
			locale: 'pl',
			namespace: 'common',
			source,
			translated: values([['count_x', '{count} wzorow']]),
			glossary: glossary([]),
			isSource: false,
		});
		expect(rules).toContain('ICU_PLURAL_DROPPED');
	});

	it('flags a bare count separated from its noun by a comma', () => {
		const source = ns([
			[
				'pieces',
				{
					text: '{count}, stitches',
					context: 'count',
					placeholders: { count: 'number' },
				},
			],
		]);
		const rules = rulesFor({
			locale: 'en',
			namespace: 'common',
			source,
			translated: values([['pieces', '{count}, stitches']]),
			glossary: glossary([]),
			isSource: true,
		});
		expect(rules).toContain('BARE_COUNT_NEEDS_ICU');
	});

	it('does not treat a term inside a larger word as present', () => {
		const source = ns([
			[
				'note',
				{
					text: 'Topstitching note',
					context: 'note',
					glossaryRefs: ['stitch'],
				},
			],
		]);
		const rules = rulesFor({
			locale: 'en',
			namespace: 'common',
			source,
			translated: values([['note', 'Topstitching note']]),
			glossary: glossary([['stitch', { source: 'stitch' }]]),
			isSource: true,
		});
		expect(rules).toContain('GLOSSARY_TERM');
	});

	it('accepts ICU exact-match branches alongside the required categories', () => {
		const source = ns([
			[
				'count_y',
				{
					text: '{count, plural, one {# y} other {# y}}',
					context: 'count',
					icu: true,
					placeholders: { count: 'number' },
				},
			],
		]);
		const rules = rulesFor({
			locale: 'pl',
			namespace: 'common',
			source,
			translated: values([
				[
					'count_y',
					'{count, plural, =0 {nic} one {# y} few {# y} many {# y} other {# y}}',
				],
			]),
			glossary: glossary([]),
			isSource: false,
		});
		expect(rules).not.toContain('ICU_LOCALE_CATEGORIES');
	});

	it('flags a worstCaseSample that itself exceeds the budget', () => {
		const source = ns([
			[
				'saved',
				{
					text: 'Saved {ago}',
					context: 'autosave',
					maxLength: 10,
					placeholders: { ago: 'string' },
					worstCaseSample: 'Saved 11 minutes ago',
				},
			],
		]);
		const rules = rulesFor({
			locale: 'en',
			namespace: 'common',
			source,
			translated: values([['saved', 'Saved {ago}']]),
			glossary: glossary([]),
			isSource: true,
		});
		expect(rules).toContain('MAXLENGTH_STATIC');
	});
});

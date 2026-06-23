import { describe, expect, it } from 'vitest';
import { createTranslator } from './runtime';
import type { Messages } from './schema';

function messages(pairs: [string, string][]): Messages {
	return Object.fromEntries(pairs);
}

describe('createTranslator', () => {
	it('renders Polish plural categories', () => {
		const { t } = createTranslator(
			'pl',
			messages([
				[
					'count_patterns',
					'{count, plural, one {# wzór} few {# wzory} many {# wzorów} other {# wzoru}}',
				],
			]),
		);
		expect(t('count_patterns', { count: 1 })).toBe('1 wzór');
		expect(t('count_patterns', { count: 3 })).toBe('3 wzory');
		expect(t('count_patterns', { count: 5 })).toBe('5 wzorów');
	});

	it('interpolates named placeholders', () => {
		const { t } = createTranslator(
			'pl',
			messages([['welcome_back', 'Witaj ponownie, {name}!']]),
		);
		expect(t('welcome_back', { name: 'Ola' })).toBe('Witaj ponownie, Ola!');
	});

	it('returns the key when a message is missing', () => {
		const { t } = createTranslator('en', messages([]));
		expect(t('nope')).toBe('nope');
	});

	it('reports membership with has()', () => {
		const translator = createTranslator('en', messages([['ok', 'OK']]));
		expect(translator.has('ok')).toBe(true);
		expect(translator.has('nope')).toBe(false);
	});

	it('degrades to the raw template when a required value is missing', () => {
		const { t } = createTranslator(
			'en',
			messages([['welcome_back', 'Welcome back, {name}!']]),
		);
		expect(t('welcome_back')).toBe('Welcome back, {name}!');
	});
});

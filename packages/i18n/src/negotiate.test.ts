import { describe, expect, it } from 'vitest';
import { negotiateLocale } from './negotiate';

describe('negotiateLocale', () => {
	it('prefers an explicit URL prefix over everything else', () => {
		expect(negotiateLocale({ url: '/pl/studio', cookie: 'tw_locale=en' })).toBe(
			'pl',
		);
	});

	it('falls back to the locale cookie', () => {
		expect(negotiateLocale({ cookie: 'theme=dark; tw_locale=pl' })).toBe('pl');
	});

	it('reads Accept-Language by q-weight', () => {
		expect(negotiateLocale({ acceptLanguage: 'pl-PL,pl;q=0.9,en;q=0.5' })).toBe(
			'pl',
		);
	});

	it('maps a regional English tag down to en', () => {
		expect(negotiateLocale({ acceptLanguage: 'en-GB,en;q=0.8' })).toBe('en');
	});

	it('falls back to the source locale when nothing matches', () => {
		expect(negotiateLocale({ acceptLanguage: 'fr-FR,de;q=0.7' })).toBe('en');
	});

	it('honours a custom fallback', () => {
		expect(negotiateLocale({}, { fallback: 'pl' })).toBe('pl');
	});

	it('reads the prefix from a relative URL carrying a query or fragment', () => {
		expect(negotiateLocale({ url: '/pl?ref=home' })).toBe('pl');
		expect(negotiateLocale({ url: '/pl#section' })).toBe('pl');
	});

	it('drops a zero or malformed q-weight entry', () => {
		expect(negotiateLocale({ acceptLanguage: 'en;q=0, pl;q=0.9' })).toBe('pl');
	});

	it('decodes a percent-encoded locale cookie value', () => {
		expect(negotiateLocale({ cookie: 'tw_locale=pl' })).toBe('pl');
	});
});

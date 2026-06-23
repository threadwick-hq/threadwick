import type { Locale } from './locale';
import { asLocale, LOCALES, SOURCE_LOCALE } from './locale';

/** Signals a request carries about the user's preferred locale. */
type LocaleSignals = {
	/** URL path or full URL; a leading `/<locale>` segment wins outright. */
	url?: string;
	/** Cookie header value; the locale cookie is consulted. */
	cookie?: string;
	/** `Accept-Language` header value. */
	acceptLanguage?: string;
};

type NegotiateOptions = {
	supported?: readonly Locale[];
	fallback?: Locale;
	cookieName?: string;
};

const DEFAULT_COOKIE_NAME = 'tw_locale';

/**
 * Resolves the locale for a request in priority order: an explicit URL prefix, then the
 * locale cookie, then `Accept-Language`, then the fallback. Pure, so it serves SSR and
 * the client identically.
 */
function negotiateLocale(
	signals: LocaleSignals,
	options?: NegotiateOptions,
): Locale {
	const supported = options?.supported ?? LOCALES;
	const fallback = options?.fallback ?? SOURCE_LOCALE;
	const cookieName = options?.cookieName ?? DEFAULT_COOKIE_NAME;

	const fromUrl = localeFromUrl(signals.url, supported);
	if (fromUrl !== undefined) {
		return fromUrl;
	}
	const fromCookie = localeFromCookie(signals.cookie, cookieName, supported);
	if (fromCookie !== undefined) {
		return fromCookie;
	}
	const fromHeader = localeFromAcceptLanguage(
		signals.acceptLanguage,
		supported,
	);
	if (fromHeader !== undefined) {
		return fromHeader;
	}
	return fallback;
}

// helpers

function localeFromUrl(
	url: string | undefined,
	supported: readonly Locale[],
): Locale | undefined {
	if (url === undefined) {
		return undefined;
	}
	const raw = url.startsWith('http') ? safePathname(url) : url;
	const path = raw.split(/[?#]/)[0] ?? '';
	const segment = path.split('/').find((part) => part.length > 0);
	return supportedLocale(segment, supported);
}

function localeFromCookie(
	cookie: string | undefined,
	name: string,
	supported: readonly Locale[],
): Locale | undefined {
	if (cookie === undefined) {
		return undefined;
	}
	const match = cookie
		.split(';')
		.map((part) => part.trim())
		.find((part) => part.startsWith(`${name}=`));
	if (match === undefined) {
		return undefined;
	}
	return supportedLocale(match.slice(name.length + 1), supported);
}

function localeFromAcceptLanguage(
	header: string | undefined,
	supported: readonly Locale[],
): Locale | undefined {
	if (header === undefined) {
		return undefined;
	}
	for (const tag of parseAcceptLanguage(header)) {
		const base = tag.split('-')[0];
		const locale = supportedLocale(base, supported);
		if (locale !== undefined) {
			return locale;
		}
	}
	return undefined;
}

/** Parses `Accept-Language` into language tags, highest q-weight first. */
function parseAcceptLanguage(header: string): string[] {
	return header
		.split(',')
		.map((part) => {
			const [tag, ...params] = part.trim().split(';');
			const quality = params
				.map((param) => param.trim())
				.find((param) => param.startsWith('q='));
			const weight = quality === undefined ? 1 : Number(quality.slice(2));
			return {
				tag: (tag ?? '').toLowerCase(),
				weight: Number.isFinite(weight) ? weight : 0,
			};
		})
		.filter((entry) => entry.tag.length > 0 && entry.weight > 0)
		.sort((a, b) => b.weight - a.weight)
		.map((entry) => entry.tag);
}

/** Narrows a candidate string to a locale that is also in the supported set. */
function supportedLocale(
	value: string | undefined,
	supported: readonly Locale[],
): Locale | undefined {
	if (value === undefined) {
		return undefined;
	}
	const locale = asLocale(value);
	return locale !== undefined && supported.includes(locale)
		? locale
		: undefined;
}

/** Pathname of a full URL, or '' when it cannot be parsed. */
function safePathname(url: string): string {
	try {
		return new URL(url).pathname;
	} catch {
		return '';
	}
}

export type { LocaleSignals, NegotiateOptions };
export { negotiateLocale };

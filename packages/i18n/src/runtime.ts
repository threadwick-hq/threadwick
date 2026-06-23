import { IntlMessageFormat } from 'intl-messageformat';
import type { Locale } from './locale';
import type { Messages } from './schema';

/** Values interpolated into a message: placeholder name to value. */
type FormatValues = Record<string, string | number | Date>;

/** Renders messages for one locale, caching compiled ICU formatters per key. */
type Translator = {
	locale: Locale;
	/** Formats `key`, interpolating `values`. Returns the key itself when it is missing. */
	t: (key: string, values?: FormatValues) => string;
	/** Whether `key` exists in this translator's bundle. */
	has: (key: string) => boolean;
};

/**
 * Builds a {@link Translator} over a context-stripped bundle. Compilation is lazy and
 * memoized: the first format of a key parses its ICU, later calls reuse the formatter.
 * A missing key returns the key, and a malformed message or a missing placeholder value
 * degrades to the raw template, so a bad string never throws out of a render.
 */
function createTranslator(locale: Locale, messages: Messages): Translator {
	const cache = new Map<string, IntlMessageFormat>();

	function t(key: string, values?: FormatValues): string {
		const message = messages[key];
		if (message === undefined) {
			return key;
		}
		try {
			const formatted = compile(cache, locale, key, message).format(values);
			return typeof formatted === 'string' ? formatted : String(formatted);
		} catch {
			return message;
		}
	}

	function has(key: string): boolean {
		return messages[key] !== undefined;
	}

	return { locale, t, has };
}

/** Returns the compiled formatter for a key, compiling and caching it on first use. */
function compile(
	cache: Map<string, IntlMessageFormat>,
	locale: Locale,
	key: string,
	message: string,
): IntlMessageFormat {
	const cached = cache.get(key);
	if (cached !== undefined) {
		return cached;
	}
	const formatter = new IntlMessageFormat(message, locale);
	cache.set(key, formatter);
	return formatter;
}

export type { FormatValues, Translator };
export { createTranslator };

/**
 * The locales Threadwick localizes into. `en` is the source of truth; every other
 * locale is produced from it by the translation pipeline. Add a locale here, author or
 * translate its bundles, and the runtime, codegen, and lint all pick it up.
 */

const LOCALES = ['en', 'pl'] as const;

type Locale = (typeof LOCALES)[number];

const SOURCE_LOCALE: Locale = 'en';

/** Every supported locale except the source. */
const TARGET_LOCALES: readonly Locale[] = LOCALES.filter(
	(locale) => locale !== SOURCE_LOCALE,
);

/** Namespaces partition messages by surface, so a screen loads only the bundle it needs. */
const NAMESPACES = ['common', 'marketing', 'studio'] as const;

type Namespace = (typeof NAMESPACES)[number];

/** Narrows an arbitrary string to a supported {@link Locale}, or `undefined` if it is not one. */
function asLocale(value: string): Locale | undefined {
	return LOCALES.find((locale) => locale === value);
}

/** Narrows an arbitrary string to a known {@link Namespace}, or `undefined`. */
function asNamespace(value: string): Namespace | undefined {
	return NAMESPACES.find((namespace) => namespace === value);
}

export type { Locale, Namespace };
export {
	asLocale,
	asNamespace,
	LOCALES,
	NAMESPACES,
	SOURCE_LOCALE,
	TARGET_LOCALES,
};

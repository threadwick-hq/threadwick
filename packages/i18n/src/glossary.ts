import type { Locale } from './locale';

/** A controlled-vocabulary term whose translation must be consistent everywhere it appears. */
type GlossaryTerm = {
	/** The English surface form, e.g. "single crochet". */
	source: string;
	/** Canonical translation per locale. Absent locales fall back to the source. */
	translations?: Partial<Record<Locale, string>>;
	/** False for brand terms that stay in English in every locale (e.g. "Studio"). */
	translate?: boolean;
	/** US crochet abbreviation, shown alongside the term where a surface calls for it. */
	abbrUs?: string;
	/** Why this term is controlled; advisory, not used by the runtime. */
	note?: string;
};

/** The glossary, keyed by term id (e.g. "single_crochet_us"). */
type Glossary = Record<string, GlossaryTerm>;

/**
 * The surface form a term must take in a locale: its translation, or the English source
 * when the term is brand/non-translatable.
 *
 * @returns the expected string, or `undefined` when the term id is unknown.
 */
function canonicalForm(
	glossary: Glossary,
	termId: string,
	locale: Locale,
): string | undefined {
	const term = glossary[termId];
	if (term === undefined) {
		return undefined;
	}
	if (term.translate === false) {
		return term.source;
	}
	return term.translations?.[locale] ?? term.source;
}

export type { Glossary, GlossaryTerm };
export { canonicalForm };

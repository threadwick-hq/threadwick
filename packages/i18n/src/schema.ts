/**
 * The enriched source schema. The English value plus the metadata an AI translator
 * needs to render every other locale accurately, and the lint needs to verify it.
 */

/** How a placeholder's value is typed, so it is never translated and the lint can check it. */
type PlaceholderKind = 'number' | 'string' | 'date';

/** One enriched source string. */
type SourceEntry = {
	/** The English text. ICU MessageFormat when {@link SourceEntry.icu} is true. */
	text: string;
	/** What this string is and where it appears; fed to the translator as context. */
	context: string;
	/** Visible-character budget for the UI slot. Enforceable only when the text has no unbounded placeholder. */
	maxLength?: number;
	/** Named placeholders and their kinds. Names are preserved verbatim in every locale. */
	placeholders?: Record<string, PlaceholderKind>;
	/** True when {@link SourceEntry.text} is ICU MessageFormat (plural, select, ...). */
	icu?: boolean;
	/** Glossary term ids whose canonical translation must appear in every locale. */
	glossaryRefs?: string[];
	/** A per-string voice override; otherwise the project voice applies. */
	tone?: string;
	/** Placeholder names that must never be translated (e.g. a user's display name). */
	doNotTranslate?: string[];
	/** A realistic longest rendering, used to check {@link SourceEntry.maxLength} when the text has an unbounded placeholder. */
	worstCaseSample?: string;
};

/** A namespace of source strings, keyed by message key. */
type SourceNamespace = Record<string, SourceEntry>;

/** A context-stripped, ready-to-render bundle for one locale and namespace. */
type Messages = Record<string, string>;

export type { Messages, PlaceholderKind, SourceEntry, SourceNamespace };

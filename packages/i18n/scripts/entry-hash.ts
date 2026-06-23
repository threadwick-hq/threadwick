import { createHash } from 'node:crypto';
import type { SourceEntry } from '../src/schema';

/**
 * A stable fingerprint of everything that should trigger re-translation: the text, its
 * context, ICU flag, placeholders, do-not-translate set, glossary refs, length budget,
 * worst-case sample, tone, and the voice version. A change to any of these invalidates a
 * cached translation; cosmetic edits elsewhere do not. A glossary edit is not captured
 * here, so re-run with `--force` after changing a term.
 */
function entryHash(entry: SourceEntry, voiceVersion: string): string {
	const material = JSON.stringify({
		text: entry.text,
		context: entry.context,
		icu: entry.icu ?? false,
		placeholders: entry.placeholders ?? {},
		doNotTranslate: entry.doNotTranslate ?? [],
		glossaryRefs: entry.glossaryRefs ?? [],
		// null (not undefined) so JSON.stringify keeps the field and an absence still
		// affects the fingerprint instead of collapsing to the same hash.
		maxLength: entry.maxLength ?? null,
		worstCaseSample: entry.worstCaseSample ?? null,
		tone: entry.tone ?? null,
		voiceVersion,
	});
	return createHash('sha256').update(material).digest('hex').slice(0, 16);
}

export { entryHash };

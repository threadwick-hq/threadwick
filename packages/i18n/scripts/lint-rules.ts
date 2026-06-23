import type { MessageFormatElement } from '@formatjs/icu-messageformat-parser';
import { parse, TYPE } from '@formatjs/icu-messageformat-parser';
import type { Glossary } from '../src/glossary';
import { canonicalForm } from '../src/glossary';
import type { Locale } from '../src/locale';
import type { Result } from '../src/result';
import { err, ok } from '../src/result';
import type { SourceEntry, SourceNamespace } from '../src/schema';

// types

/** A single lint failure, located by namespace + key. */
type Violation = {
	rule: string;
	namespace: string;
	key: string;
	message: string;
};

/** One namespace of one locale to lint: the source spec plus the locale's rendered values. */
type LintTarget = {
	locale: Locale;
	namespace: string;
	source: SourceNamespace;
	translated: Record<string, string>;
	glossary: Glossary;
	/** True for the source locale (en); enables source-only rules and self-comparison. */
	isSource: boolean;
};

type PluralUse = {
	name: string;
	type: 'cardinal' | 'ordinal';
	categories: string[];
};
type ArgInfo = { names: Set<string>; plurals: PluralUse[]; hasPound: boolean };

const STOPWORDS = new Set([
	'of',
	'in',
	'on',
	'at',
	'to',
	'by',
	'for',
	'from',
	'the',
	'a',
	'an',
	'z',
	'w',
	'na',
	'do',
	'od',
	'i',
	'o',
	'po',
	'za',
]);

// public

/** Runs every rule over one namespace of one locale and returns all violations. */
function lintNamespace(target: LintTarget): Violation[] {
	const violations: Violation[] = [];
	for (const [key, entry] of Object.entries(target.source)) {
		const value = target.translated[key];
		if (target.isSource) {
			checkSource(entry, target, key, violations);
		}
		if (value === undefined) {
			if (!target.isSource) {
				push(
					violations,
					'MISSING_TRANSLATION',
					target,
					key,
					'no translation for this key',
				);
			}
			continue;
		}
		if (value.trim() === '') {
			push(violations, 'NO_EMPTY', target, key, 'translation is empty');
			continue;
		}
		checkValue(entry, value, target, key, violations);
	}
	return violations;
}

// source-only rules (run once, against the English spec)

function checkSource(
	entry: SourceEntry,
	target: LintTarget,
	key: string,
	violations: Violation[],
): void {
	if (entry.icu !== true && hasBareCount(entry)) {
		push(
			violations,
			'BARE_COUNT_NEEDS_ICU',
			target,
			key,
			'a numeric placeholder sits next to a word; mark icu:true and use an ICU plural so the noun can agree',
		);
	}
	if (
		entry.maxLength !== undefined &&
		hasPlaceholder(entry.text) &&
		entry.worstCaseSample === undefined
	) {
		push(
			violations,
			'MAXLENGTH_STATIC',
			target,
			key,
			'maxLength on a string with a placeholder needs a worstCaseSample to check against',
		);
	}
	if (
		entry.maxLength !== undefined &&
		entry.worstCaseSample !== undefined &&
		[...entry.worstCaseSample].length > entry.maxLength
	) {
		push(
			violations,
			'MAXLENGTH_STATIC',
			target,
			key,
			`worstCaseSample length ${[...entry.worstCaseSample].length} exceeds maxLength ${entry.maxLength}`,
		);
	}
}

// value rules (run per locale)

function checkValue(
	entry: SourceEntry,
	value: string,
	target: LintTarget,
	key: string,
	violations: Violation[],
): void {
	if (entry.icu === true) {
		checkIcu(entry, value, target, key, violations);
	} else {
		checkParity(
			braceNames(entry.text),
			braceNames(value),
			target,
			key,
			violations,
		);
	}
	checkMaxLength(entry, value, target, key, violations);
	checkGlossary(entry, value, target, key, violations);
}

function checkIcu(
	entry: SourceEntry,
	value: string,
	target: LintTarget,
	key: string,
	violations: Violation[],
): void {
	const parsedValue = parseIcu(value);
	if (!parsedValue.ok) {
		push(violations, 'ICU_PARSE', target, key, parsedValue.error);
		return;
	}
	const parsedSource = parseIcu(entry.text);
	if (!parsedSource.ok) {
		if (target.isSource) {
			push(violations, 'ICU_PARSE', target, key, parsedSource.error);
		}
		return;
	}
	const sourceArgs = collectArgs(parsedSource.value);
	const valueArgs = collectArgs(parsedValue.value);

	checkParity(sourceArgs.names, valueArgs.names, target, key, violations);

	if (sourceArgs.hasPound && !valueArgs.hasPound) {
		push(
			violations,
			'ICU_HASH_PRESENT',
			target,
			key,
			'source uses # but the translation drops it',
		);
	}
	for (const sourcePlural of sourceArgs.plurals) {
		const stillPlural = valueArgs.plurals.some(
			(plural) =>
				plural.name === sourcePlural.name && plural.type === sourcePlural.type,
		);
		if (!stillPlural) {
			push(
				violations,
				'ICU_PLURAL_DROPPED',
				target,
				key,
				`source pluralizes "${sourcePlural.name}" but the translation renders it flat, so the noun cannot agree with the number`,
			);
		}
	}
	for (const plural of valueArgs.plurals) {
		const keywords = plural.categories.filter(
			(category) => !category.startsWith('='),
		);
		const missing = requiredCategories(target.locale, plural.type).filter(
			(category) => !keywords.includes(category),
		);
		if (missing.length > 0) {
			push(
				violations,
				'ICU_LOCALE_CATEGORIES',
				target,
				key,
				`plural "${plural.name}" is missing required ${target.locale} categories: ${missing.join(', ')}`,
			);
		}
	}
}

function checkParity(
	sourceNames: Set<string>,
	valueNames: Set<string>,
	target: LintTarget,
	key: string,
	violations: Violation[],
): void {
	const missing = [...sourceNames].filter((name) => !valueNames.has(name));
	const extra = [...valueNames].filter((name) => !sourceNames.has(name));
	if (missing.length > 0 || extra.length > 0) {
		push(
			violations,
			'PLACEHOLDER_PARITY',
			target,
			key,
			`placeholders differ (missing: ${list(missing)}; unexpected: ${list(extra)})`,
		);
	}
}

function checkMaxLength(
	entry: SourceEntry,
	value: string,
	target: LintTarget,
	key: string,
	violations: Violation[],
): void {
	if (entry.maxLength === undefined || entry.icu === true) {
		return;
	}
	// For a placeholder string the rendered width is locale-dependent, so check the
	// fixed (literal) part fits; the worstCaseSample check on the source guards the rest.
	const visible = hasPlaceholder(entry.text) ? stripPlaceholders(value) : value;
	const length = [...visible].length;
	if (length > entry.maxLength) {
		const label = hasPlaceholder(entry.text) ? 'literal length' : 'length';
		push(
			violations,
			'MAXLENGTH_STATIC',
			target,
			key,
			`${label} ${length} exceeds maxLength ${entry.maxLength}`,
		);
	}
}

function checkGlossary(
	entry: SourceEntry,
	value: string,
	target: LintTarget,
	key: string,
	violations: Violation[],
): void {
	for (const id of entry.glossaryRefs ?? []) {
		const expected = canonicalForm(target.glossary, id, target.locale);
		if (expected === undefined) {
			push(
				violations,
				'GLOSSARY_TERM',
				target,
				key,
				`unknown glossary term id: ${id}`,
			);
			continue;
		}
		if (!containsTerm(value, expected, target.locale)) {
			push(
				violations,
				'GLOSSARY_TERM',
				target,
				key,
				`missing canonical term "${expected}" for "${id}"`,
			);
		}
	}
}

// ICU walking

function parseIcu(message: string): Result<MessageFormatElement[], string> {
	try {
		return ok(parse(message));
	} catch (error) {
		return err(error instanceof Error ? error.message : 'ICU parse error');
	}
}

function collectArgs(elements: MessageFormatElement[]): ArgInfo {
	const info: ArgInfo = { names: new Set(), plurals: [], hasPound: false };
	walk(elements, info);
	return info;
}

function walk(elements: MessageFormatElement[], info: ArgInfo): void {
	for (const element of elements) {
		switch (element.type) {
			case TYPE.argument:
			case TYPE.number:
			case TYPE.date:
			case TYPE.time:
				info.names.add(element.value);
				break;
			case TYPE.select:
				info.names.add(element.value);
				walkOptions(element.options, info);
				break;
			case TYPE.plural:
				info.names.add(element.value);
				info.plurals.push({
					name: element.value,
					type: element.pluralType === 'ordinal' ? 'ordinal' : 'cardinal',
					categories: Object.keys(element.options),
				});
				walkOptions(element.options, info);
				break;
			case TYPE.pound:
				info.hasPound = true;
				break;
			case TYPE.tag:
				walk(element.children, info);
				break;
			default:
				break;
		}
	}
}

function walkOptions(
	options: Record<string, { value: MessageFormatElement[] }>,
	info: ArgInfo,
): void {
	for (const option of Object.values(options)) {
		walk(option.value, info);
	}
}

// small helpers

function hasBareCount(entry: SourceEntry): boolean {
	const declared = Object.entries(entry.placeholders ?? {})
		.filter(([, kind]) => kind === 'number')
		.map(([name]) => name);
	const names = declared.length > 0 ? declared : [...braceNames(entry.text)];
	return names.some((name) => numberPrecedesWord(entry.text, name));
}

function numberPrecedesWord(text: string, name: string): boolean {
	const token = `{${name}}`;
	const index = text.indexOf(token);
	if (index === -1) {
		return false;
	}
	// Skip whitespace and a comma/colon/semicolon/hyphen separator so
	// "{count}, stitches" and "{count}-stitch" are still caught.
	const word = text
		.slice(index + token.length)
		.replace(/^[\s,:;–-]+/u, '')
		.match(/^\p{L}+/u);
	if (word === null) {
		return false;
	}
	const followingWord = word[0];
	return (
		followingWord !== undefined && !STOPWORDS.has(followingWord.toLowerCase())
	);
}

function braceNames(text: string): Set<string> {
	const names = new Set<string>();
	for (const match of text.matchAll(/\{\s*([A-Za-z_][\w]*)\s*\}/g)) {
		const name = match[1];
		if (name !== undefined) {
			names.add(name);
		}
	}
	return names;
}

function hasPlaceholder(text: string): boolean {
	return /\{[^}]+\}/.test(text);
}

function requiredCategories(
	locale: Locale,
	type: 'cardinal' | 'ordinal',
): string[] {
	return Array.from(
		new Intl.PluralRules(locale, { type }).resolvedOptions().pluralCategories,
	);
}

/**
 * Whether `term` appears in `haystack` at a left word boundary (case-insensitive). The
 * left anchor stops "stitch" matching inside "topstitching" while still allowing
 * inflected suffixes ("stitches"). Diacritic-shifting stems (pl "wzór" -> "wzorów") are
 * a known gap: list such forms in the glossary if a surface needs them.
 */
function containsTerm(haystack: string, term: string, locale: Locale): boolean {
	const hay = haystack.toLocaleLowerCase(locale);
	const needle = term.toLocaleLowerCase(locale);
	if (needle.length === 0) {
		return false;
	}
	let from = 0;
	while (from <= hay.length - needle.length) {
		const at = hay.indexOf(needle, from);
		if (at === -1) {
			return false;
		}
		const before = at === 0 ? undefined : hay.charAt(at - 1);
		if (before === undefined || !/\p{L}/u.test(before)) {
			return true;
		}
		from = at + 1;
	}
	return false;
}

function stripPlaceholders(text: string): string {
	return text.replace(/\{[^}]*\}/gu, '');
}

function list(values: string[]): string {
	return values.length === 0 ? '-' : values.join(', ');
}

function push(
	violations: Violation[],
	rule: string,
	target: LintTarget,
	key: string,
	message: string,
): void {
	violations.push({ rule, namespace: target.namespace, key, message });
}

export type { LintTarget, Violation };
export { lintNamespace };

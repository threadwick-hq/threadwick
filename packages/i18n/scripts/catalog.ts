import { join } from 'node:path';
import type { Glossary, GlossaryTerm } from '../src/glossary';
import type { Locale } from '../src/locale';
import { asLocale } from '../src/locale';
import type { Result } from '../src/result';
import { err, ok } from '../src/result';
import type {
	PlaceholderKind,
	SourceEntry,
	SourceNamespace,
} from '../src/schema';
import { listJsonFiles, readJson } from './io';
import { PATHS } from './paths';

// types

type GenderPolicy = 'neutral' | 'feminine' | 'masculine';

type VoiceConfig = {
	version: string;
	description: string;
	tone: string;
	audience: string;
	genderPolicy: GenderPolicy;
};

type TranslationOrigin = 'machine' | 'human' | 'seed';

/** One stored translation with provenance and the source fingerprint it was made against. */
type TranslationRecord = {
	value: string;
	hash?: string;
	origin?: TranslationOrigin;
};

type TranslationNamespace = Record<string, TranslationRecord>;

/** Human overrides for a locale: namespace to key to value. Always wins, never re-translated. */
type OverridesFile = Record<string, Record<string, string>>;

type LockEntry = { hash: string; origin: TranslationOrigin };

/** The change-detection lock: locale to namespace to key to fingerprint + provenance. */
type LockFile = Record<string, Record<string, Record<string, LockEntry>>>;

const PLACEHOLDER_KINDS = ['number', 'string', 'date'] as const;
const GENDER_POLICIES = ['neutral', 'feminine', 'masculine'] as const;

// loaders (throw at the CLI boundary on malformed input)

/** Loads every English source namespace, keyed by namespace name. */
function loadSource(): Record<string, SourceNamespace> {
	const dir = join(PATHS.source, 'en');
	const namespaces: Record<string, SourceNamespace> = {};
	for (const namespace of listJsonFiles(dir)) {
		const parsed = parseSourceNamespace(
			readJson(join(dir, `${namespace}.json`)),
		);
		namespaces[namespace] = unwrap(parsed, `source/en/${namespace}.json`);
	}
	return namespaces;
}

/** Loads the glossary. */
function loadGlossary(): Glossary {
	return unwrap(parseGlossary(readJson(PATHS.glossary)), 'glossary.json');
}

/** Loads the voice config. */
function loadVoice(): VoiceConfig {
	return unwrap(parseVoice(readJson(PATHS.voice)), 'voice.json');
}

/** Loads a locale's stored translations, keyed by namespace. */
function loadTranslations(
	locale: Locale,
): Record<string, TranslationNamespace> {
	const dir = join(PATHS.translations, locale);
	const namespaces: Record<string, TranslationNamespace> = {};
	for (const namespace of listJsonFiles(dir)) {
		const parsed = parseTranslationNamespace(
			readJson(join(dir, `${namespace}.json`)),
		);
		namespaces[namespace] = unwrap(
			parsed,
			`translations/${locale}/${namespace}.json`,
		);
	}
	return namespaces;
}

/** Loads a locale's human overrides, or an empty set when the file is absent. */
function loadOverrides(locale: Locale): OverridesFile {
	const path = join(PATHS.overrides, `${locale}.json`);
	const raw = tryReadJson(path);
	if (raw === undefined) {
		return {};
	}
	return unwrap(parseOverrides(raw), `overrides/${locale}.json`);
}

// parsers (Result, so they are testable in isolation)

function parseSourceNamespace(raw: unknown): Result<SourceNamespace, string> {
	if (!isRecord(raw)) {
		return err('namespace is not an object');
	}
	const namespace: SourceNamespace = {};
	for (const [key, value] of Object.entries(raw)) {
		const entry = parseSourceEntry(value);
		if (!entry.ok) {
			return err(`${key}: ${entry.error}`);
		}
		namespace[key] = entry.value;
	}
	return ok(namespace);
}

function parseSourceEntry(raw: unknown): Result<SourceEntry, string> {
	if (!isRecord(raw)) {
		return err('entry is not an object');
	}
	if (typeof raw.text !== 'string') {
		return err('text must be a string');
	}
	if (typeof raw.context !== 'string') {
		return err('context must be a string');
	}
	const entry: SourceEntry = { text: raw.text, context: raw.context };
	if (typeof raw.maxLength === 'number') {
		entry.maxLength = raw.maxLength;
	}
	if (raw.icu === true) {
		entry.icu = true;
	}
	if (typeof raw.tone === 'string') {
		entry.tone = raw.tone;
	}
	if (isStringArray(raw.glossaryRefs)) {
		entry.glossaryRefs = raw.glossaryRefs;
	}
	if (isStringArray(raw.doNotTranslate)) {
		entry.doNotTranslate = raw.doNotTranslate;
	}
	if (typeof raw.worstCaseSample === 'string') {
		entry.worstCaseSample = raw.worstCaseSample;
	}
	const placeholders = parsePlaceholders(raw.placeholders);
	if (placeholders !== undefined) {
		entry.placeholders = placeholders;
	}
	return ok(entry);
}

function parsePlaceholders(
	raw: unknown,
): Record<string, PlaceholderKind> | undefined {
	if (!isRecord(raw)) {
		return undefined;
	}
	const placeholders: Record<string, PlaceholderKind> = {};
	for (const [name, kind] of Object.entries(raw)) {
		if (typeof kind === 'string' && isPlaceholderKind(kind)) {
			placeholders[name] = kind;
		}
	}
	return placeholders;
}

function parseGlossary(raw: unknown): Result<Glossary, string> {
	if (!isRecord(raw)) {
		return err('glossary is not an object');
	}
	const glossary: Glossary = {};
	for (const [id, value] of Object.entries(raw)) {
		const term = parseGlossaryTerm(value);
		if (!term.ok) {
			return err(`${id}: ${term.error}`);
		}
		glossary[id] = term.value;
	}
	return ok(glossary);
}

function parseGlossaryTerm(raw: unknown): Result<GlossaryTerm, string> {
	if (!isRecord(raw)) {
		return err('term is not an object');
	}
	if (typeof raw.source !== 'string') {
		return err('source must be a string');
	}
	const term: GlossaryTerm = { source: raw.source };
	if (raw.translate === false) {
		term.translate = false;
	}
	if (typeof raw.abbrUs === 'string') {
		term.abbrUs = raw.abbrUs;
	}
	if (typeof raw.note === 'string') {
		term.note = raw.note;
	}
	const translations = parseTranslationsMap(raw.translations);
	if (translations !== undefined) {
		term.translations = translations;
	}
	return ok(term);
}

function parseTranslationsMap(
	raw: unknown,
): Partial<Record<Locale, string>> | undefined {
	if (!isRecord(raw)) {
		return undefined;
	}
	const map: Partial<Record<Locale, string>> = {};
	for (const [code, value] of Object.entries(raw)) {
		const locale = asLocale(code);
		if (locale !== undefined && typeof value === 'string') {
			map[locale] = value;
		}
	}
	return map;
}

function parseVoice(raw: unknown): Result<VoiceConfig, string> {
	if (!isRecord(raw)) {
		return err('voice is not an object');
	}
	const { version, description, tone, audience, genderPolicy } = raw;
	if (
		typeof version !== 'string' ||
		typeof description !== 'string' ||
		typeof tone !== 'string' ||
		typeof audience !== 'string'
	) {
		return err('version, description, tone, and audience must be strings');
	}
	if (typeof genderPolicy !== 'string' || !isGenderPolicy(genderPolicy)) {
		return err('genderPolicy must be one of neutral, feminine, masculine');
	}
	return ok({ version, description, tone, audience, genderPolicy });
}

function parseTranslationNamespace(
	raw: unknown,
): Result<TranslationNamespace, string> {
	if (!isRecord(raw)) {
		return err('translations namespace is not an object');
	}
	const namespace: TranslationNamespace = {};
	for (const [key, value] of Object.entries(raw)) {
		if (!isRecord(value) || typeof value.value !== 'string') {
			return err(`${key}: value must be a string`);
		}
		const record: TranslationRecord = { value: value.value };
		if (typeof value.hash === 'string') {
			record.hash = value.hash;
		}
		if (typeof value.origin === 'string' && isOrigin(value.origin)) {
			record.origin = value.origin;
		}
		namespace[key] = record;
	}
	return ok(namespace);
}

function parseOverrides(raw: unknown): Result<OverridesFile, string> {
	if (!isRecord(raw)) {
		return err('overrides is not an object');
	}
	const overrides: OverridesFile = {};
	for (const [namespace, value] of Object.entries(raw)) {
		if (!isRecord(value)) {
			return err(`${namespace}: must be an object`);
		}
		const entries: Record<string, string> = {};
		for (const [key, text] of Object.entries(value)) {
			if (typeof text === 'string') {
				entries[key] = text;
			}
		}
		overrides[namespace] = entries;
	}
	return ok(overrides);
}

// guards + utilities

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
	return (
		Array.isArray(value) && value.every((item) => typeof item === 'string')
	);
}

function isPlaceholderKind(value: string): value is PlaceholderKind {
	return PLACEHOLDER_KINDS.some((kind) => kind === value);
}

function isGenderPolicy(value: string): value is GenderPolicy {
	return GENDER_POLICIES.some((policy) => policy === value);
}

function isOrigin(value: string): value is TranslationOrigin {
	return value === 'machine' || value === 'human' || value === 'seed';
}

/** Reads JSON, treating only a missing file as absent. Malformed JSON throws so human
 * overrides are never silently discarded as if the file were not there. */
function tryReadJson(path: string): unknown {
	try {
		return readJson(path);
	} catch (error) {
		if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
			return undefined;
		}
		throw error;
	}
}

/** Converts a parser {@link Result} to a value, throwing a located error on failure. */
function unwrap<T>(result: Result<T, string>, file: string): T {
	if (!result.ok) {
		throw new Error(`${file}: ${result.error}`);
	}
	return result.value;
}

export type {
	GenderPolicy,
	LockEntry,
	LockFile,
	OverridesFile,
	TranslationNamespace,
	TranslationOrigin,
	TranslationRecord,
	VoiceConfig,
};
export {
	loadGlossary,
	loadOverrides,
	loadSource,
	loadTranslations,
	loadVoice,
	parseGlossary,
	parseSourceNamespace,
	parseVoice,
};

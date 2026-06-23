import { SOURCE_LOCALE, TARGET_LOCALES } from '../src/locale';
import type { SourceNamespace } from '../src/schema';
import type { TranslationNamespace } from './catalog';
import {
	loadGlossary,
	loadOverrides,
	loadSource,
	loadTranslations,
} from './catalog';
import type { Violation } from './lint-rules';
import { lintNamespace } from './lint-rules';

function main(): void {
	const source = loadSource();
	const glossary = loadGlossary();
	const violations: Violation[] = [];

	for (const [namespace, entries] of Object.entries(source)) {
		violations.push(
			...lintNamespace({
				locale: SOURCE_LOCALE,
				namespace,
				source: entries,
				translated: sourceValues(entries),
				glossary,
				isSource: true,
			}),
		);
	}

	for (const locale of TARGET_LOCALES) {
		const translations = loadTranslations(locale);
		const overrides = loadOverrides(locale);
		for (const [namespace, entries] of Object.entries(source)) {
			violations.push(
				...lintNamespace({
					locale,
					namespace,
					source: entries,
					translated: mergeTranslated(
						translations[namespace] ?? {},
						overrides[namespace] ?? {},
					),
					glossary,
					isSource: false,
				}),
			);
		}
	}

	finish(violations);
}

// helpers

function sourceValues(entries: SourceNamespace): Record<string, string> {
	const values: Record<string, string> = {};
	for (const [key, entry] of Object.entries(entries)) {
		values[key] = entry.text;
	}
	return values;
}

function mergeTranslated(
	records: TranslationNamespace,
	overrides: Record<string, string>,
): Record<string, string> {
	const values: Record<string, string> = {};
	for (const [key, record] of Object.entries(records)) {
		values[key] = record.value;
	}
	for (const [key, value] of Object.entries(overrides)) {
		values[key] = value;
	}
	return values;
}

function finish(violations: Violation[]): void {
	if (violations.length === 0) {
		console.log('i18n lint: ok');
		return;
	}
	for (const violation of violations) {
		console.error(
			`  ${violation.rule}  ${violation.namespace}.${violation.key}  ${violation.message}`,
		);
	}
	console.error(`i18n lint: ${violations.length} violation(s)`);
	process.exit(1);
}

main();

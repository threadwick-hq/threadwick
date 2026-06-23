import { join } from 'node:path';
import type { Glossary } from '../src/glossary';
import { canonicalForm } from '../src/glossary';
import type { Locale } from '../src/locale';
import { asLocale, TARGET_LOCALES } from '../src/locale';
import type { SourceEntry } from '../src/schema';
import type {
	LockFile,
	TranslationNamespace,
	TranslationRecord,
	VoiceConfig,
} from './catalog';
import {
	loadGlossary,
	loadOverrides,
	loadSource,
	loadTranslations,
	loadVoice,
} from './catalog';
import type { Decision, Status } from './decide';
import { decide } from './decide';
import { entryHash } from './entry-hash';
import { writeJson } from './io';
import { PATHS } from './paths';
import type { TranslationRequest, Translator } from './translator';
import { claudeTranslator, echoTranslator } from './translator';

// types

type Task = {
	locale: Locale;
	namespace: string;
	key: string;
	entry: SourceEntry;
	currentHash: string;
	decision: Decision;
};

// pipeline

async function main(): Promise<void> {
	const args = process.argv.slice(2);
	const useEcho = args.includes('--echo');
	const force = args.includes('--force');
	const onlyLocale = readLocaleFlag(args);

	const source = loadSource();
	const glossary = loadGlossary();
	const voice = loadVoice();
	const targets = onlyLocale === undefined ? TARGET_LOCALES : [onlyLocale];

	const tasks = planTasks(targets, source, voice, force);
	const pending = tasks.filter((task) => task.decision.status === 'translate');
	const translator = resolveTranslator(useEcho, pending.length);

	const bundles = new Map<string, TranslationNamespace>();
	const lock: LockFile = {};
	const tally: Record<Status, number> = {
		override: 0,
		adopt: 0,
		keep: 0,
		stale: 0,
		translate: 0,
	};

	for (const task of tasks) {
		const record = await resolveRecord(task, translator, glossary, voice);
		const bundleKey = `${task.locale}/${task.namespace}`;
		const bundle = bundles.get(bundleKey) ?? {};
		bundle[task.key] = record;
		bundles.set(bundleKey, bundle);
		recordLock(lock, task, record);
		tally[task.decision.status] += 1;
	}

	writeBundles(bundles);
	writeJson(PATHS.lock, lock);
	report(tally);
}

/** Plans an action for every (locale, namespace, key) without calling the translator. */
function planTasks(
	targets: readonly Locale[],
	source: Record<string, Record<string, SourceEntry>>,
	voice: VoiceConfig,
	force: boolean,
): Task[] {
	const tasks: Task[] = [];
	for (const locale of targets) {
		const translations = loadTranslations(locale);
		const overrides = loadOverrides(locale);
		for (const [namespace, entries] of Object.entries(source)) {
			for (const [key, entry] of Object.entries(entries)) {
				const currentHash = entryHash(entry, voice.version);
				const existing = translations[namespace]?.[key];
				const override = overrides[namespace]?.[key];
				const decision = decide(currentHash, existing, override, force);
				tasks.push({ locale, namespace, key, entry, currentHash, decision });
			}
		}
	}
	return tasks;
}

/** Runs the translator for a `translate` task; returns the planned record otherwise. */
async function resolveRecord(
	task: Task,
	translator: Translator,
	glossary: Glossary,
	voice: VoiceConfig,
): Promise<TranslationRecord> {
	if (task.decision.record !== undefined) {
		return task.decision.record;
	}
	try {
		const value = await translator(buildRequest(task, glossary, voice));
		return { value, hash: task.currentHash, origin: 'machine' };
	} catch (error) {
		throw new Error(
			`translate ${task.locale}/${task.namespace}.${task.key}: ${reason(error)}`,
		);
	}
}

function buildRequest(
	task: Task,
	glossary: Glossary,
	voice: VoiceConfig,
): TranslationRequest {
	const terms = (task.entry.glossaryRefs ?? []).map((id) => {
		const term = glossary[id];
		return {
			id,
			source: term?.source ?? id,
			target: canonicalForm(glossary, id, task.locale) ?? id,
			translate: term?.translate !== false,
		};
	});
	return {
		key: task.key,
		entry: task.entry,
		locale: task.locale,
		terms,
		voice,
	};
}

/** Picks a translator, or fails fast when work is pending but no engine is available. */
function resolveTranslator(useEcho: boolean, pending: number): Translator {
	const apiKey = process.env.ANTHROPIC_API_KEY;
	if (!useEcho && apiKey !== undefined && apiKey.length > 0) {
		return claudeTranslator({ apiKey, model: process.env.I18N_MODEL });
	}
	if (useEcho) {
		return echoTranslator();
	}
	if (pending > 0) {
		throw new Error(
			`${pending} string(s) need translation but ANTHROPIC_API_KEY is not set. Set it, or pass --echo to fill from English.`,
		);
	}
	return () => Promise.reject(new Error('translator invoked unexpectedly'));
}

// helpers

function recordLock(
	lock: LockFile,
	task: Task,
	record: TranslationRecord,
): void {
	const byNamespace = lock[task.locale] ?? {};
	const byKey = byNamespace[task.namespace] ?? {};
	byKey[task.key] = {
		hash: record.hash ?? task.currentHash,
		origin: record.origin ?? 'machine',
	};
	byNamespace[task.namespace] = byKey;
	lock[task.locale] = byNamespace;
}

function writeBundles(bundles: Map<string, TranslationNamespace>): void {
	for (const [bundleKey, bundle] of bundles) {
		writeJson(join(PATHS.translations, `${bundleKey}.json`), bundle);
	}
}

function readLocaleFlag(args: string[]): Locale | undefined {
	const index = args.indexOf('--locale');
	if (index === -1) {
		return undefined;
	}
	const value = args[index + 1];
	const locale = value === undefined ? undefined : asLocale(value);
	if (locale === undefined) {
		throw new Error(`--locale expects a supported locale, got: ${value ?? ''}`);
	}
	return locale;
}

function report(tally: Record<Status, number>): void {
	const summary = Object.entries(tally)
		.map(([status, count]) => `${status} ${count}`)
		.join(', ');
	console.log(`i18n translate: ${summary}`);
	if (tally.stale > 0) {
		console.warn(
			`i18n translate: ${tally.stale} human override(s) are stale (source changed). Review and update.`,
		);
	}
}

function reason(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

await main();

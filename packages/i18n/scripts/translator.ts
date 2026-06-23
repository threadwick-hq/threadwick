import type { Locale } from '../src/locale';
import type { SourceEntry } from '../src/schema';
import type { VoiceConfig } from './catalog';

// types

/** A glossary term resolved for one target locale, handed to the translator as a constraint. */
type GlossaryDirective = {
	id: string;
	source: string;
	target: string;
	translate: boolean;
};

/** Everything the translator needs to render one entry into one locale. */
type TranslationRequest = {
	key: string;
	entry: SourceEntry;
	locale: Locale;
	terms: GlossaryDirective[];
	voice: VoiceConfig;
};

/** Translates one entry into one locale. Implementations: Claude (real), echo (offline/tests). */
type Translator = (request: TranslationRequest) => Promise<string>;

type ClaudeOptions = {
	apiKey: string;
	model?: string;
};

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const DEFAULT_MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 2048;
const MAX_ATTEMPTS = 3;
const RETRY_BASE_MS = 500;

/** A failure worth retrying: a network error or a 429/5xx from the API. */
class TransientError extends Error {}

const SYSTEM_PROMPT = [
	'You are a professional UI localizer for Threadwick, a crochet pattern app.',
	'You translate one short UI string at a time from English into the target locale.',
	'Return ONLY the translated string, with no quotes, labels, or commentary.',
	'Preserve ICU MessageFormat syntax exactly, including every {placeholder}, the # number marker, and all plural categories required by the target language.',
	'Never translate placeholder variable names. Keep brand terms verbatim when told to.',
	'Honour the provided glossary terms exactly, and respect the character budget when one is given.',
].join(' ');

// translators

/**
 * A {@link Translator} backed by Claude. The prompt injects the entry's context, the
 * resolved glossary directives, the project voice, and the ICU/placeholder/length rules.
 * Transient failures (network, 429, 5xx) are retried with backoff; a truncated response,
 * a 4xx, or an unexpected payload throws (operator-facing failure).
 */
function claudeTranslator(options: ClaudeOptions): Translator {
	const model = options.model ?? DEFAULT_MODEL;
	return (request) => translateWithRetry(options.apiKey, model, request);
}

async function translateWithRetry(
	apiKey: string,
	model: string,
	request: TranslationRequest,
): Promise<string> {
	for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
		try {
			return await callClaude(apiKey, model, request);
		} catch (error) {
			if (!(error instanceof TransientError) || attempt === MAX_ATTEMPTS) {
				throw error;
			}
			await delay(RETRY_BASE_MS * attempt);
		}
	}
	throw new TransientError('translation retries exhausted');
}

async function callClaude(
	apiKey: string,
	model: string,
	request: TranslationRequest,
): Promise<string> {
	let response: Response;
	try {
		response = await fetch(ANTHROPIC_URL, {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
				'x-api-key': apiKey,
				'anthropic-version': ANTHROPIC_VERSION,
			},
			body: JSON.stringify({
				model,
				// biome-ignore lint/style/useNamingConvention: the Anthropic API requires snake_case.
				max_tokens: MAX_TOKENS,
				system: SYSTEM_PROMPT,
				messages: [{ role: 'user', content: buildPrompt(request) }],
			}),
		});
	} catch (error) {
		throw new TransientError(
			`network error contacting Claude: ${reason(error)}`,
		);
	}
	if (response.status === 429 || response.status >= 500) {
		throw new TransientError(
			`Claude ${response.status}: ${await response.text()}`,
		);
	}
	if (!response.ok) {
		throw new Error(
			`Claude request failed: ${response.status} ${await response.text()}`,
		);
	}
	return extractText(await response.json());
}

/** A {@link Translator} that returns the English text unchanged. For offline pipeline runs and tests. */
function echoTranslator(): Translator {
	return (request) => Promise.resolve(request.entry.text);
}

/** Builds the per-entry user prompt. Exported so the prompt can be unit-tested. */
function buildPrompt(request: TranslationRequest): string {
	const { entry, locale, terms, voice } = request;
	const lines = [
		`Target locale: ${locale}`,
		`Voice: ${voice.tone} Audience: ${voice.audience} Gender policy: ${voice.genderPolicy}.`,
		`Context: ${entry.context}`,
	];
	if (entry.tone !== undefined) {
		lines.push(`Tone for this string: ${entry.tone}`);
	}
	if (entry.icu === true) {
		lines.push(
			'This string is ICU MessageFormat. Emit every plural category the target language requires and keep the # marker.',
		);
	}
	const placeholderNames = Object.keys(entry.placeholders ?? {});
	if (placeholderNames.length > 0) {
		lines.push(`Placeholders (keep verbatim): ${placeholderNames.join(', ')}`);
	}
	const doNotTranslate = entry.doNotTranslate ?? [];
	if (doNotTranslate.length > 0) {
		lines.push(`Do not translate, keep verbatim: ${doNotTranslate.join(', ')}`);
	}
	if (entry.maxLength !== undefined) {
		lines.push(
			`Character budget: at most ${entry.maxLength} visible characters.`,
		);
	}
	for (const term of terms) {
		lines.push(
			term.translate
				? `Glossary: translate "${term.source}" as "${term.target}".`
				: `Glossary: keep "${term.source}" untranslated.`,
		);
	}
	lines.push(`English: ${entry.text}`);
	lines.push('Translation:');
	return lines.join('\n');
}

// helpers

/** Narrows a Claude Messages response to its first text block, throwing on any mismatch. */
function extractText(payload: unknown): string {
	if (!isRecord(payload) || !Array.isArray(payload.content)) {
		throw new Error('Unexpected Claude response shape');
	}
	if (payload.stop_reason === 'max_tokens') {
		throw new Error(
			'Claude response was truncated (max_tokens); raise MAX_TOKENS',
		);
	}
	const block = payload.content.find(isTextBlock);
	if (block === undefined) {
		throw new Error('Claude response had no text block');
	}
	return block.text.trim();
}

function isTextBlock(value: unknown): value is { type: 'text'; text: string } {
	return (
		isRecord(value) && value.type === 'text' && typeof value.text === 'string'
	);
}

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

function reason(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export type { GlossaryDirective, TranslationRequest, Translator };
export { buildPrompt, claudeTranslator, DEFAULT_MODEL, echoTranslator };

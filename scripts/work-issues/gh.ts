/**
 * Thin wrapper around the `gh` CLI. All GitHub IO flows through GhRunner so
 * tests can stub it and offline failures surface as Results, never throws.
 */

import { execFileSync } from 'node:child_process';
import { isRecord } from './json';
import type { Result } from './types';

export type GhFailure = {
	message: string;
	exitCode: number | undefined;
};

export type GhResult = Result<string, GhFailure>;

/** Runs `gh` with the given args; stdin is passed through when provided. */
export type GhRunner = (args: readonly string[], stdin?: string) => GhResult;

const GH_TIMEOUT_MS = 30_000;

export function runGh(args: readonly string[], stdin?: string): GhResult {
	try {
		const stdout = execFileSync('gh', [...args], {
			input: stdin,
			encoding: 'utf8',
			stdio: ['pipe', 'pipe', 'pipe'],
			timeout: GH_TIMEOUT_MS,
			maxBuffer: 32 * 1024 * 1024,
		});
		return { ok: true, value: stdout };
	} catch (error) {
		return { ok: false, error: describeFailure(error) };
	}
}

/** One-line, actionable failure summary (auth, network, or API error). */
export function ghFailureHint(failure: GhFailure): string {
	const text = failure.message;
	if (/auth|credentials|logged in|GH_TOKEN/i.test(text)) {
		return `gh is not authenticated (run \`gh auth login\`): ${firstLine(text)}`;
	}
	if (/ENOTFOUND|ETIMEDOUT|ECONNREFUSED|network|dial tcp/i.test(text)) {
		return `network unreachable: ${firstLine(text)}`;
	}
	return firstLine(text);
}

function describeFailure(error: unknown): GhFailure {
	const record = isRecord(error) ? error : {};
	const stderrValue = record.stderr;
	const stderr =
		typeof stderrValue === 'string'
			? stderrValue
			: stderrValue instanceof Buffer
				? stderrValue.toString('utf8')
				: '';
	const exitCode =
		typeof record.status === 'number' ? record.status : undefined;
	const fallback = error instanceof Error ? error.message : String(error);
	const message = stderr.trim().length > 0 ? stderr.trim() : fallback;
	return { message, exitCode };
}

function firstLine(text: string): string {
	return text.split('\n', 1)[0] ?? text;
}

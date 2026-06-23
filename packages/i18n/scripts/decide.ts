import type { TranslationOrigin, TranslationRecord } from './catalog';

/** What the pipeline will do with one entry for one locale. */
type Status = 'override' | 'adopt' | 'keep' | 'stale' | 'translate';

type Decision = { status: Status; record?: TranslationRecord };

/**
 * The change-detection + override policy.
 *
 * - A human override always wins and is never re-translated.
 * - A record whose fingerprint still matches the source is kept.
 * - A seeded value with no fingerprint (or a stale one) is adopted: kept as-is and
 *   re-fingerprinted, so hand-provided seeds survive a source change. Use `--force` to
 *   replace seeds with real translations.
 * - A human-edited value whose source changed is held and flagged stale for review.
 * - A machine value whose source changed is re-translated.
 */
function decide(
	currentHash: string,
	existing: TranslationRecord | undefined,
	override: string | undefined,
	force: boolean,
): Decision {
	if (override !== undefined) {
		return record('override', override, currentHash, 'human');
	}
	if (existing === undefined || existing.value === '' || force) {
		return { status: 'translate' };
	}
	if (existing.hash === currentHash) {
		return record(
			'keep',
			existing.value,
			currentHash,
			existing.origin ?? 'machine',
		);
	}
	if (existing.hash === undefined || existing.origin === 'seed') {
		return record(
			'adopt',
			existing.value,
			currentHash,
			existing.origin ?? 'seed',
		);
	}
	if (existing.origin === 'human') {
		return record('stale', existing.value, existing.hash, 'human');
	}
	return { status: 'translate' };
}

function record(
	status: Status,
	value: string,
	hash: string,
	origin: TranslationOrigin,
): Decision {
	return { status, record: { value, hash, origin } };
}

export type { Decision, Status };
export { decide };

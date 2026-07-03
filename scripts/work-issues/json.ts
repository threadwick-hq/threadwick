/**
 * Narrowing helpers for untrusted JSON (gh output). Values enter as `unknown`
 * and are narrowed field by field; nothing is asserted.
 */

export function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function getRecord(
	source: Record<string, unknown>,
	key: string,
): Record<string, unknown> | undefined {
	const value = source[key];
	return isRecord(value) ? value : undefined;
}

export function getArray(
	source: Record<string, unknown>,
	key: string,
): unknown[] | undefined {
	const value = source[key];
	return Array.isArray(value) ? value : undefined;
}

export function getString(
	source: Record<string, unknown>,
	key: string,
): string | undefined {
	const value = source[key];
	return typeof value === 'string' ? value : undefined;
}

export function getNumber(
	source: Record<string, unknown>,
	key: string,
): number | undefined {
	const value = source[key];
	return typeof value === 'number' && Number.isFinite(value)
		? value
		: undefined;
}

export function getBoolean(
	source: Record<string, unknown>,
	key: string,
): boolean | undefined {
	const value = source[key];
	return typeof value === 'boolean' ? value : undefined;
}

/** Parses JSON text into unknown without throwing. */
export function parseJson(text: string): unknown {
	try {
		return JSON.parse(text);
	} catch {
		return undefined;
	}
}

/** Maps array entries that are records; silently drops anything else. */
export function recordEntries(
	values: unknown[] | undefined,
): Record<string, unknown>[] {
	return (values ?? []).filter(isRecord);
}

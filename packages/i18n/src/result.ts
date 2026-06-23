/**
 * A success-or-failure value the caller is forced to handle. Used for expected runtime
 * outcomes (a malformed source file, a lint violation), not for contract violations,
 * which throw.
 */
type Result<T, E = string> = { ok: true; value: T } | { ok: false; error: E };

function ok<T>(value: T): Result<T, never> {
	return { ok: true, value };
}

function err<E>(error: E): Result<never, E> {
	return { ok: false, error };
}

export type { Result };
export { err, ok };

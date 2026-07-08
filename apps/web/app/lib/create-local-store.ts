import { useSyncExternalStore } from 'react';

export type LocalStoreOptions<T> = {
	/** The `localStorage` key this store reads from and persists to. */
	storageKey: string;
	/** Value used when storage is empty, unavailable (e.g. during SSR), or holds invalid data. */
	seed: () => T;
	/** Narrows a JSON-parsed value to `T`; values that don't match fall back to `seed()`. */
	isValid: (value: unknown) => value is T;
};

export type LocalStoreUpdateOptions = {
	/** Whether to notify subscribers after this update. Defaults to `true`. */
	notify?: boolean;
};

export type LocalStore<T> = {
	/** Returns the current in-memory value without subscribing to changes. */
	getSnapshot: () => T;
	/** Registers a change listener and returns a function that unsubscribes it. */
	subscribe: (listener: () => void) => () => void;
	/**
	 * Applies `updater` to the current value, persists the result to `localStorage`, and (unless
	 * `notify` is explicitly `false`) notifies subscribers. Returns the new value.
	 */
	update: (updater: (current: T) => T, options?: LocalStoreUpdateOptions) => T;
	/** React hook: subscribes to the store and returns the current value. SSR-safe. */
	use: () => T;
};

/**
 * Creates a module-singleton store backed by `localStorage`, with a `useSyncExternalStore`-based
 * `use()` hook for React consumers.
 *
 * The value is loaded once, eagerly, from `storageKey`; missing or invalid data falls back to
 * `seed()`. When `localStorage` is unavailable (SSR) the store stays in-memory only — reads
 * return `seed()`, writes are silently skipped — so importing the module never throws
 * server-side. The snapshot reference only changes via `update()`, which keeps the value returned
 * to `useSyncExternalStore`'s server snapshot stable across a render.
 *
 * @param options - Storage key, seed value, and a validator for parsed JSON.
 * @returns A store with snapshot/subscribe/update primitives and a `use()` hook.
 */
export function createLocalStore<T>(
	options: LocalStoreOptions<T>,
): LocalStore<T> {
	const { storageKey, seed, isValid } = options;

	function load(): T {
		if (typeof localStorage === 'undefined') return seed();
		try {
			const raw = localStorage.getItem(storageKey);
			if (!raw) return seed();
			const parsed: unknown = JSON.parse(raw);
			return isValid(parsed) ? parsed : seed();
		} catch {
			return seed();
		}
	}

	function save(value: T): void {
		if (typeof localStorage === 'undefined') return;
		localStorage.setItem(storageKey, JSON.stringify(value));
	}

	let snapshot = load();
	// Stable server snapshot: SSR/hydration must render the seed on both sides,
	// then flip to the persisted value post-hydration — otherwise the server
	// (no localStorage) and the hydrating client disagree and React logs a
	// hydration mismatch.
	const serverSnapshot = seed();
	const listeners = new Set<() => void>();

	function notify(): void {
		for (const listener of listeners) listener();
	}

	function getSnapshot(): T {
		return snapshot;
	}

	function subscribe(listener: () => void): () => void {
		listeners.add(listener);
		return () => {
			listeners.delete(listener);
		};
	}

	function update(
		updater: (current: T) => T,
		updateOptions?: LocalStoreUpdateOptions,
	): T {
		snapshot = updater(snapshot);
		save(snapshot);
		if (updateOptions?.notify !== false) notify();
		return snapshot;
	}

	function useSnapshot(): T {
		return useSyncExternalStore(subscribe, getSnapshot, () => serverSnapshot);
	}

	return { getSnapshot, subscribe, update, use: useSnapshot };
}

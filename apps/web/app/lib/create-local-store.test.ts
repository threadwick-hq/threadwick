import { afterEach, describe, expect, it, vi } from 'vitest';
import { createLocalStore } from './create-local-store';

type CounterState = { count: number };

const STORAGE_KEY = 'test.counter.v1';

function isCounterState(value: unknown): value is CounterState {
	if (typeof value !== 'object' || value === null) return false;
	if (!('count' in value)) return false;
	return typeof value.count === 'number';
}

function createCounterStore() {
	return createLocalStore<CounterState>({
		storageKey: STORAGE_KEY,
		seed: () => ({ count: 0 }),
		isValid: isCounterState,
	});
}

/** Minimal in-memory stand-in for the two `Storage` members the helper touches. */
function createMemoryLocalStorage(initial?: Record<string, string>) {
	const entries = new Map<string, string>(Object.entries(initial ?? {}));
	return {
		getItem: (key: string) => entries.get(key) ?? null,
		setItem: (key: string, value: string) => {
			entries.set(key, value);
		},
	};
}

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('createLocalStore', () => {
	it('notifies subscribers on update and stops after unsubscribe', () => {
		vi.stubGlobal('localStorage', createMemoryLocalStorage());
		const store = createCounterStore();
		const listener = vi.fn();
		const unsubscribe = store.subscribe(listener);

		store.update((current) => ({ count: current.count + 1 }));
		expect(listener).toHaveBeenCalledTimes(1);
		expect(store.getSnapshot()).toEqual({ count: 1 });

		store.update((current) => ({ count: current.count + 1 }), {
			notify: false,
		});
		expect(listener).toHaveBeenCalledTimes(1);
		expect(store.getSnapshot()).toEqual({ count: 2 });

		unsubscribe();
		store.update((current) => ({ count: current.count + 1 }));
		expect(listener).toHaveBeenCalledTimes(1);
	});

	it('persists updates to localStorage and reloads them in a fresh store', () => {
		const storage = createMemoryLocalStorage();
		vi.stubGlobal('localStorage', storage);

		const first = createCounterStore();
		first.update(() => ({ count: 7 }));
		expect(storage.getItem(STORAGE_KEY)).toBe('{"count":7}');

		const second = createCounterStore();
		expect(second.getSnapshot()).toEqual({ count: 7 });
	});

	it('falls back to an in-memory store with a stable snapshot when localStorage is undefined', () => {
		// The node environment has no localStorage — the SSR module-eval path.
		expect(typeof localStorage).toBe('undefined');

		const store = createCounterStore();
		expect(store.getSnapshot()).toEqual({ count: 0 });
		// Reference-stable reads: useSyncExternalStore's server snapshot must not
		// change identity between calls, or React warns and re-renders in a loop.
		expect(store.getSnapshot()).toBe(store.getSnapshot());

		const listener = vi.fn();
		store.subscribe(listener);
		expect(() =>
			store.update((current) => ({ count: current.count + 1 })),
		).not.toThrow();
		expect(store.getSnapshot()).toEqual({ count: 1 });
		expect(listener).toHaveBeenCalledTimes(1);
	});

	it('falls back to the seed on corrupted JSON', () => {
		vi.stubGlobal(
			'localStorage',
			createMemoryLocalStorage({ [STORAGE_KEY]: '{not valid json' }),
		);
		const store = createCounterStore();
		expect(store.getSnapshot()).toEqual({ count: 0 });
	});

	it('falls back to the seed on well-formed JSON that fails validation', () => {
		vi.stubGlobal(
			'localStorage',
			createMemoryLocalStorage({ [STORAGE_KEY]: '{"count":"nope"}' }),
		);
		const store = createCounterStore();
		expect(store.getSnapshot()).toEqual({ count: 0 });
	});
});

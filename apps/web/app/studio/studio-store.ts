import { useEffect, useState } from 'react';

declare global {
	interface Window {
		/** Debug/smoke-test handle exposed once the studio store hydrates. */
		threadwick?: { store: unknown };
	}
}

type StudioStore = Awaited<ReturnType<typeof loadStudioStore>>;

let storePromise: ReturnType<typeof loadStudioStore> | null = null;

/**
 * Resolve the localStorage-backed editor store singleton, hydrated exactly once per page load:
 * the editor runtime is dynamically imported (client-only), localStorage is loaded, and a worked
 * sample is seeded on first run. Both the sidebar (counts) and the editor share this one store.
 */
export function ensureStudioStore() {
	if (!storePromise) storePromise = loadStudioStore();
	return storePromise;
}

/** Subscribe a component to the studio store; returns the hydrated store, or `null` until it loads. */
export function useStudioStore(): StudioStore | null {
	const [store, setStore] = useState<StudioStore | null>(null);
	const [, bump] = useState(0);
	useEffect(() => {
		let active = true;
		let unsubscribe = () => {};
		void ensureStudioStore().then((resolved) => {
			if (!active) return;
			setStore(resolved);
			unsubscribe = resolved.subscribe(() => bump((n) => n + 1));
		});
		return () => {
			active = false;
			unsubscribe();
		};
	}, []);
	return store;
}

async function loadStudioStore() {
	const [core, browser] = await Promise.all([import('@threadwick/editor'), import('@threadwick/editor/browser')]);
	const { store } = browser;
	store.loadLocal();
	if (store.state.library.projects.length === 0) {
		store.state.library.projects.push(core.sampleProject());
		store.saveLocal();
	}
	window.threadwick = { store };
	return store;
}

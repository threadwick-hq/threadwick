/** Runtime capability flags — gates optional integrations so the offline app stays complete. */

export type ThreadwickCapabilities = {
	/** Ravelry OAuth sync (status mapping, stash search). Off by default. */
	ravelry: boolean;
};

const DEFAULT_CAPABILITIES: ThreadwickCapabilities = {
	ravelry: false,
};

let runtime = { ...DEFAULT_CAPABILITIES };

/** Read the current capability snapshot (never null — defaults are always defined). */
export function getCapabilities(): Readonly<ThreadwickCapabilities> {
	return runtime;
}

/** Merge partial overrides (e.g. from env at app boot). */
export function setCapabilities(partial: Partial<ThreadwickCapabilities>): void {
	runtime = { ...runtime, ...partial };
}

/** Reset to defaults — useful in tests. */
export function resetCapabilities(): void {
	runtime = { ...DEFAULT_CAPABILITIES };
}

export function isRavelryEnabled(): boolean {
	return runtime.ravelry;
}

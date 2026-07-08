/** Runtime capability flags — gates optional integrations so the offline app stays complete. */

export type ThreadwickCapabilities = {
	/** Ravelry OAuth sync (status mapping, stash search). Off by default. */
	ravelry: boolean;
	/**
	 * The marketplace (buy/sell/discover) — the networked layer. Native default
	 * (on); a private/offline build turns it off and the app stays complete.
	 */
	marketplace: boolean;
};

const DEFAULT_CAPABILITIES: ThreadwickCapabilities = {
	ravelry: false,
	marketplace: true,
};

let runtime = { ...DEFAULT_CAPABILITIES };

/** Read the current capability snapshot (never null — defaults are always defined). */
export function getCapabilities(): Readonly<ThreadwickCapabilities> {
	return runtime;
}

/** Merge partial overrides (e.g. from env at app boot). */
export function setCapabilities(
	partial: Partial<ThreadwickCapabilities>,
): void {
	runtime = { ...runtime, ...partial };
}

/** Reset to defaults — useful in tests. */
export function resetCapabilities(): void {
	runtime = { ...DEFAULT_CAPABILITIES };
}

export function isRavelryEnabled(): boolean {
	return runtime.ravelry;
}

export function isMarketplaceEnabled(): boolean {
	return runtime.marketplace;
}

/**
 * Home second-block decouple rules (spec §3). Kept pure so the contract "with
 * the marketplace off, discovery and the creator teaser both drop while the
 * rest of Home stands" stays verifiable.
 */

/** Which second block Home renders below Continue. */
export type SecondBlockMode = 'discovery' | 'library';

/**
 * Marketplace discovery shows only when the networked layer is on AND there are
 * suggestions to show; otherwise Home falls back to a larger peek at the user's
 * own library.
 */
export function secondBlockMode(
	marketplaceEnabled: boolean,
	hasDiscovery: boolean,
): SecondBlockMode {
	return marketplaceEnabled && hasDiscovery ? 'discovery' : 'library';
}

/**
 * The creator teaser is a marketplace surface: it appears only for a published
 * creator and only while the marketplace capability is on, so a decoupled
 * offline build shows neither it nor discovery.
 */
export function shouldShowCreatorTeaser(
	marketplaceEnabled: boolean,
	isCreator: boolean,
): boolean {
	return marketplaceEnabled && isCreator;
}

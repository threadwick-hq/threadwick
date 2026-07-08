import type { ReactNode } from 'react';
import { isMarketplaceEnabled } from '../capabilities';

/**
 * Renders its children only when the marketplace capability is on. With the flag
 * off (a private/offline build), no marketplace nav or surface renders and the
 * app stays complete. Capabilities are set once at app boot, so this render-time
 * read is stable.
 */
export function MarketplaceGate({ children }: { children: ReactNode }) {
	return isMarketplaceEnabled() ? <>{children}</> : null;
}

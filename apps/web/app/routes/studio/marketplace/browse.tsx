import { isMarketplaceEnabled } from '@threadwick/core/capabilities';
import { Navigate } from 'react-router';
import { MarketplaceBrowse } from '../../../studio/marketplace-browse';

/** Marketplace › Browse — the full, filterable catalogue grid (spec #93). */
export default function MarketplaceBrowseRoute() {
	if (!isMarketplaceEnabled()) return <Navigate to="/studio" replace />;
	return <MarketplaceBrowse />;
}

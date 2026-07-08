import { isMarketplaceEnabled } from '@threadwick/core/capabilities';
import { Navigate } from 'react-router';
import { MarketplaceBrowse } from '../../../studio/marketplace-browse';

/** Marketplace › Free — the catalogue grid locked to free listings (spec #93). */
export default function MarketplaceFreeRoute() {
	if (!isMarketplaceEnabled()) return <Navigate to="/studio" replace />;
	return <MarketplaceBrowse preset="free" />;
}

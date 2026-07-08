import { isMarketplaceEnabled } from '@threadwick/core/capabilities';
import { Navigate } from 'react-router';
import { MarketplaceBrowse } from '../../../studio/marketplace-browse';

/** Marketplace › Following — the catalogue grid locked to designers you follow (spec #93). */
export default function MarketplaceFollowingRoute() {
	if (!isMarketplaceEnabled()) return <Navigate to="/studio" replace />;
	return <MarketplaceBrowse preset="following" />;
}

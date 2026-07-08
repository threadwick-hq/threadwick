import { isMarketplaceEnabled } from '@threadwick/core/capabilities';
import { Navigate } from 'react-router';
import { MarketplaceBrowse } from '../../../studio/marketplace-browse';

/** Marketplace › Wishlist — the catalogue grid locked to bookmarked patterns (spec #93). */
export default function MarketplaceWishlistRoute() {
	if (!isMarketplaceEnabled()) return <Navigate to="/studio" replace />;
	return <MarketplaceBrowse preset="wishlist" />;
}

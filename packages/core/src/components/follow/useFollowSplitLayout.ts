import { useEffect, useState } from 'react';

const SPLIT_LANDSCAPE = '(min-width: 768px) and (orientation: landscape)';
const SPLIT_DESKTOP = '(min-width: 1024px)';

/** True when chart and controls render side-by-side (tablet-landscape / desktop). */
export function useFollowSplitLayout(): boolean {
	const [split, setSplit] = useState(false);

	useEffect(() => {
		const mqLandscape = window.matchMedia(SPLIT_LANDSCAPE);
		const mqDesktop = window.matchMedia(SPLIT_DESKTOP);
		const update = () => {
			setSplit(mqLandscape.matches || mqDesktop.matches);
		};
		update();
		mqLandscape.addEventListener('change', update);
		mqDesktop.addEventListener('change', update);
		return () => {
			mqLandscape.removeEventListener('change', update);
			mqDesktop.removeEventListener('change', update);
		};
	}, []);

	return split;
}

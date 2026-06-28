import type { IconGlyph } from './Logo';

/**
 * Brand-mark glyphs as static SVG path data, baked once so `@threadwick/core` builds
 * with no Font Awesome Pro token. Unlike `@threadwick/icons` (the swappable, action-named
 * runtime icon system), brand marks are fixed identity assets, so their geometry is
 * committed here.
 *
 * All three marks (`REEL`, `COMPASS_DRAFTING`, `STORE`) are original artwork — freely
 * committable. Use `scripts/gen-brand-glyphs.ts` only as an optional FA reference utility;
 * it never runs during build and never overwrites this file.
 */
/** Threadwick — an original thread-spool mark: two slim flanges over three wound coils. */
export const REEL: IconGlyph = {
	viewBox: '0 0 46 60',
	path: 'M3.5,0 H42.5 A3.5,3.5 0 0 1 42.5,7 H3.5 A3.5,3.5 0 0 1 3.5,0 Z M3.5,53 H42.5 A3.5,3.5 0 0 1 42.5,60 H3.5 A3.5,3.5 0 0 1 3.5,53 Z M8.5,14 H37.5 A3.5,3.5 0 0 1 37.5,21 H8.5 A3.5,3.5 0 0 1 8.5,14 Z M8.5,26 H37.5 A3.5,3.5 0 0 1 37.5,33 H8.5 A3.5,3.5 0 0 1 8.5,26 Z M8.5,38 H37.5 A3.5,3.5 0 0 1 37.5,45 H8.5 A3.5,3.5 0 0 1 8.5,38 Z',
};

/** Threadwick Studio — an original drafting-compass mark: hinge, needle leg, pencil leg. */
export const COMPASS_DRAFTING: IconGlyph = {
	viewBox: '0 0 48 56',
	path: 'M14,0 H34 A3.5,3.5 0 0 1 34,7 H14 A3.5,3.5 0 0 1 14,0 Z M21,2 H27 A2,2 0 0 1 27,6 H21 A2,2 0 0 1 21,2 Z M20,7 L11,49 A2.5,2.5 0 0 0 7,51 L16,9 A2,2 0 0 0 20,7 Z M28,7 L37,49 A2.5,2.5 0 0 1 41,51 L32,9 A2,2 0 0 1 28,7 Z M29,36 H35 A1.5,1.5 0 0 1 35,39 H29 A1.5,1.5 0 0 1 29,36 Z',
};

/** Threadwick Marketplace — an original storefront mark: awning scallops over a shop body. */
export const STORE: IconGlyph = {
	viewBox: '0 0 48 52',
	path: 'M4,0 H44 A3.5,3.5 0 0 1 44,7 H4 A3.5,3.5 0 0 1 4,0 Z M6,10 H18 A3.5,3.5 0 0 1 18,17 H6 A3.5,3.5 0 0 1 6,10 Z M18,10 H30 A3.5,3.5 0 0 1 30,17 H18 A3.5,3.5 0 0 1 18,10 Z M30,10 H42 A3.5,3.5 0 0 1 42,17 H30 A3.5,3.5 0 0 1 30,10 Z M8,22 H40 A3.5,3.5 0 0 1 40,48 H8 A3.5,3.5 0 0 1 8,22 Z M22,34 H26 A2,2 0 0 1 26,48 H22 A2,2 0 0 1 22,34 Z',
};

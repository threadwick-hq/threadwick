import { faReel } from '@fortawesome/pro-regular-svg-icons/faReel';
import { faCompassDrafting } from '@fortawesome/pro-regular-svg-icons/faCompassDrafting';
import { faStore } from '@fortawesome/pro-regular-svg-icons/faStore';
import { Logo, fromAwesome, type IconGlyph, type LogoProps } from './Logo';

// Font Awesome Regular glyphs, adapted to plain {path, viewBox}. The icon data is
// bundled into dist at build time, so consumers don't need a Font Awesome Pro token —
// only core's own build does. (See package.json devDependencies + tsup bundling.)
const REEL = fromAwesome(faReel);
const COMPASS_DRAFTING = fromAwesome(faCompassDrafting);
const STORE = fromAwesome(faStore);

/** Per-surface icon glyphs — for static SVG output via `logoSVG()` (favicons / OG). */
export const logoIcons: Record<'threadwick' | 'studio' | 'marketplace', IconGlyph> = {
  threadwick: REEL,
  studio: COMPASS_DRAFTING,
  marketplace: STORE,
};

type NamedLogoProps = Omit<LogoProps, 'icon'>;

/** Threadwick — a reel in the brand square. */
export function ThreadwickLogo(props: NamedLogoProps) {
  return <Logo icon={REEL} title="Threadwick" {...props} />;
}

/** Threadwick Studio — a drafting compass. */
export function StudioLogo(props: NamedLogoProps) {
  return <Logo icon={COMPASS_DRAFTING} title="Threadwick Studio" {...props} />;
}

/** Threadwick Marketplace — a storefront. */
export function MarketplaceLogo(props: NamedLogoProps) {
  return <Logo icon={STORE} title="Threadwick Marketplace" {...props} />;
}

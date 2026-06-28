import { COMPASS_DRAFTING, REEL, STORE } from './glyphs';
import { type IconGlyph, Logo, type LogoProps } from './Logo';

/** Per-surface icon glyphs — for static SVG output via `logoSVG()` (favicons / OG). */
export const logoIcons: Record<
	'threadwick' | 'studio' | 'marketplace',
	IconGlyph
> = {
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

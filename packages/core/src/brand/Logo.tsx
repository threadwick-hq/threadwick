import type { CSSProperties } from 'react';
import { roleHex } from '../tokens';

/**
 * An icon glyph: SVG path data designed within `viewBox`. Font-Awesome-compatible —
 * adapt an FA IconDefinition with {@link fromAwesome}.
 */
export interface IconGlyph {
  path: string;
  /** The glyph's own viewBox. Defaults to Font Awesome's `0 0 512 512`. */
  viewBox?: string;
}

/** Adapt a Font Awesome `IconDefinition` (`{ icon: [w, h, , , path] }`) to an {@link IconGlyph}. */
export function fromAwesome(faIcon: {
  icon: [number, number, unknown, unknown, string | string[]];
}): IconGlyph {
  const [w, h, , , d] = faIcon.icon;
  return { path: Array.isArray(d) ? d.join('') : d, viewBox: `0 0 ${w} ${h}` };
}

/** The brand badge is authored on a 128-px square. */
export const LOGO_BOX = 128;

/** Centre + scale a glyph's viewBox inside the 128 square; returns the SVG `transform`. */
function placeGlyph(viewBox = '0 0 512 512', iconScale = 0.5): string {
  const [minX, minY, w, h] = viewBox.split(/\s+/).map(Number);
  const s = (LOGO_BOX * iconScale) / Math.max(w, h);
  const tx = (LOGO_BOX - w * s) / 2 - minX * s;
  const ty = (LOGO_BOX - h * s) / 2 - minY * s;
  return `translate(${+tx.toFixed(2)} ${+ty.toFixed(2)}) scale(${+s.toFixed(4)})`;
}

export interface LogoProps {
  /** The icon rendered in the brand square. */
  icon: IconGlyph;
  /** Rendered size in px (the badge is square). Default 128. */
  size?: number;
  /** Corner radius at the 128 design scale. Default 16. */
  radius?: number;
  /** Icon size as a fraction of the square (0–1). Default 0.5. */
  iconScale?: number;
  /** Accessible name; omit to render decoratively (`aria-hidden`). */
  title?: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * The Threadwick brand badge — a rounded brand-colour square with a centred icon.
 * Colours come from tokens (`--tw-primary` square, `--tw-on-primary` glyph), so the
 * badge follows the theme. For a static asset (favicon / OG image) use {@link logoSVG}.
 */
export function Logo({
  icon,
  size = LOGO_BOX,
  radius = 16,
  iconScale = 0.5,
  title,
  className,
  style,
}: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${LOGO_BOX} ${LOGO_BOX}`}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
      className={className}
      style={style}
    >
      <rect width={LOGO_BOX} height={LOGO_BOX} rx={radius} fill="var(--tw-primary)" />
      <path d={icon.path} transform={placeGlyph(icon.viewBox, iconScale)} fill="var(--tw-on-primary)" />
    </svg>
  );
}

/**
 * Render the badge as a standalone SVG string with CONCRETE colours — for favicons,
 * OG images, and any non-React / no-CSS context. Defaults to the light-mode brand.
 */
export function logoSVG(
  icon: IconGlyph,
  opts: { primary?: string; onPrimary?: string; size?: number; radius?: number; iconScale?: number } = {},
): string {
  const {
    primary = roleHex.light.primary,
    onPrimary = roleHex.light.onPrimary,
    size = LOGO_BOX,
    radius = 16,
    iconScale = 0.5,
  } = opts;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${LOGO_BOX} ${LOGO_BOX}">` +
    `<rect width="${LOGO_BOX}" height="${LOGO_BOX}" rx="${radius}" fill="${primary}"/>` +
    `<path d="${icon.path}" transform="${placeGlyph(icon.viewBox, iconScale)}" fill="${onPrimary}"/>` +
    `</svg>`
  );
}

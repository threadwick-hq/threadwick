import { Logo } from './Logo';
import { logoIcons } from './logos';

/**
 * The Threadwick lockup: the brand logo (a reel on the brand square) + the lowercase
 * "threadwick" wordmark. Themed via tokens — the badge is `--tw-primary` /
 * `--tw-on-primary`, the wordmark is `--tw-text`. The mark is decorative; the link's
 * `aria-label` (or the surrounding text) carries the accessible name.
 */
export function Wordmark({
  size = 28,
  asLink = true,
  showTagline = false,
  href = '/',
}: {
  size?: number;
  asLink?: boolean;
  showTagline?: boolean;
  href?: string;
}) {
  const inner = (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <Logo icon={logoIcons.threadwick} size={size} />
      <span style={{ display: 'inline-flex', flexDirection: 'column', lineHeight: 1.05 }}>
        <span
          style={{
            fontFamily: 'var(--tw-font-display)',
            fontSize: 'clamp(17px, 4.6vw, 20px)',
            fontWeight: 700,
            color: 'var(--tw-text)',
            letterSpacing: '-0.02em',
          }}
        >
          threadwick
        </span>
        {showTagline && (
          <span style={{ fontSize: 11.5, color: 'var(--tw-text-tertiary)', letterSpacing: '0.02em' }}>
            for fiber artists
          </span>
        )}
      </span>
    </span>
  );

  if (!asLink) return inner;
  return (
    <a href={href} aria-label="Threadwick — home" style={{ textDecoration: 'none' }}>
      {inner}
    </a>
  );
}

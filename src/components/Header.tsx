import { colors } from '../theme/tokens';
import { OpenStudioButton } from './OpenStudioButton';
import { Wordmark } from './Wordmark';

/** Sticky, minimal header: wordmark (with tagline) + the single CTA. */
export function Header() {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(246, 244, 239, 0.82)',
        backdropFilter: 'saturate(180%) blur(10px)',
        WebkitBackdropFilter: 'saturate(180%) blur(10px)',
        borderBottom: `1px solid ${colors.borderSecondary}`,
        // Pin to its own compositing layer so the translucent/blurred sticky bar
        // doesn't sub-pixel jitter (appear to change height) while scrolling on mobile.
        transform: 'translateZ(0)',
        willChange: 'transform',
        WebkitBackfaceVisibility: 'hidden',
        backfaceVisibility: 'hidden',
      }}
    >
      <div
        className="tw-container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          height: 64,
          boxSizing: 'border-box',
        }}
      >
        <Wordmark showTagline />
        <OpenStudioButton />
      </div>
    </header>
  );
}

import { GithubCircle } from 'iconoir-react';
import { STUDIO_IS_EXTERNAL, STUDIO_REPO_URL, STUDIO_URL } from '../config';
import { colors } from '../theme/tokens';
import { Wordmark } from './Wordmark';

const navLinks = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#faq', label: 'FAQ' },
];

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer style={{ borderTop: `1px solid ${colors.border}`, background: colors.bgContainer }}>
      <div
        className="tw-container"
        style={{ paddingBlock: 'clamp(32px, 5vw, 48px)' }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 24,
            alignItems: 'flex-start',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ maxWidth: 320 }}>
            <Wordmark showTagline />
            <p style={{ margin: '14px 0 0', color: colors.textSecondary, fontSize: 14 }}>
              A home for fiber artists and hobbyists. Design crochet charts the way you make them.
            </p>
          </div>

          <nav aria-label="Footer" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 24px' }}>
            {navLinks.map((l) => (
              <a key={l.href} href={l.href} style={{ color: colors.textSecondary, fontSize: 14 }}>
                {l.label}
              </a>
            ))}
            <a
              href={STUDIO_URL}
              target={STUDIO_IS_EXTERNAL ? '_blank' : undefined}
              rel={STUDIO_IS_EXTERNAL ? 'noopener noreferrer' : undefined}
              style={{ color: colors.textSecondary, fontSize: 14 }}
            >
              Open Studio
            </a>
            <a
              href={STUDIO_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: colors.textSecondary, fontSize: 14 }}
            >
              <GithubCircle aria-hidden width="1.1em" height="1.1em" />
              GitHub
            </a>
          </nav>
        </div>

        <div
          style={{
            marginTop: 28,
            paddingTop: 18,
            borderTop: `1px solid ${colors.borderSecondary}`,
            color: colors.textTertiary,
            fontSize: 13,
          }}
        >
          © {year} Threadwick
        </div>
      </div>
    </footer>
  );
}

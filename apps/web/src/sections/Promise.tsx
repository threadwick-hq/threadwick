import { PLEDGES } from '../data/promise';
import { colors } from '../theme/tokens';
import './promise.css';

const CREAM = colors.bgLayout;

/**
 * "Our promise" — the fairness manifesto, placed right after the hero and
 * highlighted as a full-bleed ink band so it reads as the page's statement
 * piece (custom header colors, so SectionHeading isn't reused here).
 */
export function OurPromise() {
  return (
    <section aria-labelledby="promise-title" className="tw-section" style={{ background: colors.text }}>
      <div className="tw-container">
        <div style={{ textAlign: 'center', maxWidth: 680, marginInline: 'auto', marginBottom: 'clamp(28px, 4vw, 44px)' }}>
          <p
            style={{
              margin: '0 0 10px',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              fontSize: 12.5,
              fontWeight: 600,
              color: '#e09d7e',
            }}
          >
            Our promise
          </p>
          <h2
            id="promise-title"
            className="tw-display"
            style={{ margin: 0, fontSize: 'clamp(26px, 3.6vw, 36px)', color: CREAM }}
          >
            Fair tools for fiber artists &amp; makers
          </h2>
          <p style={{ margin: '14px 0 0', fontSize: 'clamp(15px, 1.6vw, 17px)', color: 'rgba(246, 244, 239, 0.75)' }}>
            This isn’t a tagline — it’s how we make decisions. The tools are free; paying only ever
            enters the picture if you choose to sell through the platform. That’s how we’re building
            Threadwick to be fair to the artists who design patterns and the makers who follow them.
          </p>
        </div>

        <ul className="tw-pledges">
          {PLEDGES.map(({ icon: Icon, title, body }) => (
            <li key={title} style={{ textAlign: 'center' }}>
              <span
                aria-hidden
                style={{
                  display: 'grid',
                  placeItems: 'center',
                  width: 56,
                  height: 56,
                  margin: '0 auto 16px',
                  borderRadius: 999,
                  background: colors.primary,
                  color: '#fff',
                }}
              >
                <Icon width="1.6em" height="1.6em" />
              </span>
              <h3 className="tw-display" style={{ margin: '0 0 8px', fontSize: 18, color: CREAM }}>
                {title}
              </h3>
              <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6, color: 'rgba(246, 244, 239, 0.72)' }}>
                {body}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

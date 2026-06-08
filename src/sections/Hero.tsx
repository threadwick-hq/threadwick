import { Typography } from 'antd';
import { Lock } from 'iconoir-react';
import { OpenStudioButton } from '../components/OpenStudioButton';
import { colors } from '../theme/tokens';

const { Title, Paragraph } = Typography;

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="tw-section">
      <div className="tw-container">
        <div style={{ maxWidth: 780 }}>
          <p
            style={{
              margin: '0 0 14px',
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              fontSize: 13,
              fontWeight: 600,
              color: colors.primaryActive,
            }}
          >
            A studio for fiber artists
          </p>

          <Title
            id="hero-title"
            level={1}
            style={{
              margin: 0,
              fontSize: 'clamp(36px, 6.5vw, 60px)',
              lineHeight: 1.04,
              letterSpacing: '-0.02em',
            }}
          >
            Design your stitches the way you make them
          </Title>

          <Paragraph
            style={{
              margin: '20px 0 0',
              maxWidth: 600,
              fontSize: 'clamp(18px, 2vw, 20px)',
              color: colors.textSecondary,
            }}
          >
            Threadwick Studio is where you chart your designs stitch by stitch — and keep every project’s
            patterns, yarns, links and notes together in one tidy place.
          </Paragraph>

          <div
            style={{
              marginTop: 30,
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <OpenStudioButton size="large" />
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                color: colors.textTertiary,
                fontSize: 14,
              }}
            >
              <Lock aria-hidden width="1.05em" height="1.05em" />
              Free in your browser — no account needed
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

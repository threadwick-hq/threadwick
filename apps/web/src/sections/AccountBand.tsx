import { Typography } from 'antd';
import { OpenStudioButton } from '../components/OpenStudioButton';
import { colors, radii } from '../theme/tokens';

const { Title, Paragraph } = Typography;

export function AccountBand() {
  return (
    <section aria-labelledby="account-title" className="tw-section">
      <div className="tw-container">
        <div
          style={{
            textAlign: 'center',
            padding: 'clamp(36px, 6vw, 64px) clamp(20px, 5vw, 56px)',
            borderRadius: radii.xl,
            background: `linear-gradient(160deg, ${colors.primaryWash}, ${colors.primarySoft})`,
            border: `1px solid ${colors.border}`,
          }}
        >
          <Title
            id="account-title"
            level={2}
            style={{ margin: 0, fontSize: 'clamp(26px, 3.6vw, 38px)' }}
          >
            A home for fiber artists
          </Title>
          <Paragraph
            style={{
              margin: '16px auto 0',
              maxWidth: 560,
              fontSize: 'clamp(15px, 1.7vw, 18px)',
              color: colors.textSecondary,
            }}
          >
            Start free right in your browser — your work stays with you. Create a free account when you’re
            ready for more: sync across your devices, keep cloud backups, and share your patterns. Your
            work is always yours — export it and walk away anytime, no lock-in.
          </Paragraph>
          <div style={{ marginTop: 28 }}>
            <OpenStudioButton size="large" />
          </div>
        </div>
      </div>
    </section>
  );
}

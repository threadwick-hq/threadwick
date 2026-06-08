import { Typography } from 'antd';
import { colors } from '../theme/tokens';

const { Title, Paragraph } = Typography;

/**
 * Consistent section header: an eyebrow, an <h2> (carrying the id used for
 * aria-labelledby and anchor navigation), and an optional lead paragraph.
 */
export function SectionHeading({
  id,
  eyebrow,
  title,
  lead,
  align = 'left',
}: {
  id: string;
  eyebrow?: string;
  title: string;
  lead?: string;
  align?: 'left' | 'center';
}) {
  return (
    <div
      style={{
        textAlign: align,
        maxWidth: align === 'center' ? 680 : undefined,
        marginInline: align === 'center' ? 'auto' : undefined,
        marginBottom: 'clamp(28px, 4vw, 44px)',
      }}
    >
      {eyebrow && (
        <p
          style={{
            margin: '0 0 10px',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            fontSize: 12.5,
            fontWeight: 600,
            color: colors.primaryActive,
          }}
        >
          {eyebrow}
        </p>
      )}
      <Title id={id} level={2} style={{ margin: 0, fontSize: 'clamp(26px, 3.6vw, 36px)' }}>
        {title}
      </Title>
      {lead && (
        <Paragraph
          style={{
            margin: '14px 0 0',
            fontSize: 'clamp(15px, 1.6vw, 17px)',
            color: colors.textSecondary,
            maxWidth: 620,
            marginInline: align === 'center' ? 'auto' : undefined,
          }}
        >
          {lead}
        </Paragraph>
      )}
    </div>
  );
}

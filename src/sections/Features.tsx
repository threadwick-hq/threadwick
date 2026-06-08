import { Card, Col, Row } from 'antd';
import { FEATURES } from '../data/features';
import { SectionHeading } from '../components/SectionHeading';
import { colors, radii } from '../theme/tokens';

export function Features() {
  return (
    <section aria-labelledby="features-title" className="tw-section">
      <div className="tw-container">
        <SectionHeading
          id="features-title"
          eyebrow="What you get"
          title="Made for keeping projects together"
          lead="Everything you need to chart, save and share your projects — without the clutter."
          align="center"
        />
        <Row gutter={[20, 20]}>
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <Col xs={24} sm={12} lg={8} key={title}>
              <Card style={{ height: '100%' }} variant="outlined">
                <span
                  aria-hidden
                  style={{
                    display: 'grid',
                    placeItems: 'center',
                    width: 44,
                    height: 44,
                    borderRadius: radii.lg,
                    background: colors.primaryWash,
                    color: colors.primary,
                    marginBottom: 14,
                  }}
                >
                  <Icon width="1.5em" height="1.5em" />
                </span>
                <h3 style={{ margin: '0 0 8px', fontSize: 18, color: colors.text }}>{title}</h3>
                <p style={{ margin: 0, color: colors.textSecondary, fontSize: 15, lineHeight: 1.55 }}>
                  {body}
                </p>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </section>
  );
}

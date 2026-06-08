import { Col, Row } from 'antd';
import { STEPS } from '../data/steps';
import { SectionHeading } from '../components/SectionHeading';
import { colors, radii } from '../theme/tokens';

export function HowItWorks() {
  return (
    <section
      aria-labelledby="how-it-works-title"
      className="tw-section"
      style={{ background: colors.bgContainer, borderBlock: `1px solid ${colors.borderSecondary}` }}
    >
      <div className="tw-container">
        <SectionHeading
          id="how-it-works-title"
          eyebrow="Three simple steps"
          title="From idea to chart in minutes"
          align="center"
        />
        <Row gutter={[24, 24]}>
          {STEPS.map((step, i) => (
            <Col xs={24} md={8} key={step.title}>
              <div
                style={{
                  height: '100%',
                  padding: 24,
                  borderRadius: radii.xl,
                  background: colors.bgLayout,
                  border: `1px solid ${colors.border}`,
                }}
              >
                <span
                  aria-hidden
                  className="tw-display"
                  style={{
                    display: 'grid',
                    placeItems: 'center',
                    width: 44,
                    height: 44,
                    borderRadius: 999,
                    background: colors.primary,
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 18,
                    marginBottom: 16,
                  }}
                >
                  {i + 1}
                </span>
                <h3 style={{ margin: '0 0 8px', fontSize: 18, color: colors.text }}>{step.title}</h3>
                <p style={{ margin: 0, color: colors.textSecondary, fontSize: 15, lineHeight: 1.55 }}>
                  {step.body}
                </p>
              </div>
            </Col>
          ))}
        </Row>
      </div>
    </section>
  );
}

import { useState } from 'react';
import { Col, Row, Select } from 'antd';
import { Check } from 'iconoir-react';
import { SectionHeading } from '../components/SectionHeading';
import { StitchLegend } from '../components/StitchLegend';
import type { CrochetRegion } from '../data/stitches';
import { colors } from '../theme/tokens';

const points = [
  'Place stitches in the order you’d crochet them — the chart grows round by round as you go.',
  'No fiddly counting or symmetry math; Threadwick works out the spacing for you.',
  'Charts use the standard crochet symbols, so they’re easy for anyone to read.',
];

export function DesignApproach() {
  const [region, setRegion] = useState<CrochetRegion>('US');

  return (
    <section
      aria-labelledby="approach-title"
      className="tw-section"
      style={{ background: colors.bgContainer, borderBlock: `1px solid ${colors.borderSecondary}` }}
    >
      <div className="tw-container">
        {/* Text comes first in the DOM (mobile reads heading-first); on desktop the
            tiles are ordered to the left and the text to the right. */}
        <Row gutter={[48, 40]} align="middle">
          <Col xs={24} md={{ span: 11, order: 2 }}>
            <SectionHeading
              id="approach-title"
              eyebrow="Crochet · granny squares"
              title="Chart granny squares the way you crochet them"
              lead="Threadwick Studio starts with crochet granny squares. Build a chart stitch by stitch — it follows how you actually crochet and keeps every round lined up, with no graph-paper guesswork."
            />
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 14 }}>
              {points.map((p) => (
                <li key={p} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span
                    aria-hidden
                    style={{
                      display: 'grid',
                      placeItems: 'center',
                      flex: '0 0 auto',
                      width: 26,
                      height: 26,
                      borderRadius: 999,
                      background: colors.primary,
                      color: '#fff',
                      marginTop: 1,
                    }}
                  >
                    <Check width="1em" height="1em" />
                  </span>
                  <span style={{ color: colors.textSecondary, fontSize: 16 }}>{p}</span>
                </li>
              ))}
            </ul>
          </Col>

          <Col xs={24} md={{ span: 13, order: 1 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                flexWrap: 'wrap',
                marginBottom: 14,
              }}
            >
              <h3 style={{ margin: 0, fontSize: 16, color: colors.text }}>The symbols you’ll see</h3>
              <Select<CrochetRegion>
                size="small"
                value={region}
                onChange={setRegion}
                aria-label="Choose crochet terminology"
                style={{ minWidth: 116 }}
                options={[
                  { value: 'US', label: 'US terms' },
                  { value: 'UK', label: 'UK terms' },
                ]}
              />
            </div>
            <StitchLegend region={region} />
          </Col>
        </Row>
      </div>
    </section>
  );
}

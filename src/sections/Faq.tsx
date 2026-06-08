import { Collapse } from 'antd';
import type { CollapseProps } from 'antd';
import { FAQS } from '../data/faqs';
import { SectionHeading } from '../components/SectionHeading';
import { colors } from '../theme/tokens';

export function Faq() {
  const items: CollapseProps['items'] = FAQS.map((faq, i) => ({
    key: String(i),
    label: <span style={{ fontWeight: 600, fontSize: 16 }}>{faq.q}</span>,
    children: (
      <p style={{ margin: 0, color: colors.textSecondary, fontSize: 15, lineHeight: 1.6 }}>{faq.a}</p>
    ),
  }));

  return (
    <section
      aria-labelledby="faq-title"
      className="tw-section"
      style={{ background: colors.bgContainer, borderTop: `1px solid ${colors.borderSecondary}` }}
    >
      <div className="tw-container" style={{ maxWidth: 760 }}>
        <SectionHeading id="faq-title" eyebrow="Questions" title="Good to know" align="center" />
        <Collapse items={items} accordion bordered={false} defaultActiveKey={['0']} />
      </div>
    </section>
  );
}

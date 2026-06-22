import { describe, expect, it } from 'vitest';
import { faqJsonLd, render } from './entry-server';
import { FAQS } from './data/faqs';

describe('entry-server (prerender)', () => {
  it('renders the real page content to a static HTML string', () => {
    const html = render();
    // The things crawlers and AI agents rely on must be in the markup, not just
    // produced by client-side JS.
    expect(html).toContain('Design your stitches the way you make them'); // hero h1
    expect(html).toContain('Good to know'); // FAQ heading
    expect(html).toContain('Open Studio'); // primary CTA
    expect(html).toContain('Everything in one place'); // a feature
    expect(html.length).toBeGreaterThan(5000);
  });

  it('builds FAQPage structured data from the same copy the page renders', () => {
    const data = faqJsonLd() as {
      '@type': string;
      mainEntity: { '@type': string; name: string; acceptedAnswer: { text: string } }[];
    };
    expect(data['@type']).toBe('FAQPage');
    expect(data.mainEntity).toHaveLength(FAQS.length);
    expect(data.mainEntity.map((q) => q.name)).toEqual(FAQS.map((f) => f.q));
    expect(data.mainEntity[0].acceptedAnswer.text).toBe(FAQS[0].a);
  });
});

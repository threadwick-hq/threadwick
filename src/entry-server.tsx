/**
 * Server entry used at build time to prerender the homepage to static HTML
 * (see scripts/prerender.mjs). The homepage is a client-rendered SPA, so without
 * this step crawlers and AI agents that don't execute JavaScript would see an
 * empty shell. Prerendering bakes the real content into dist/index.html; the
 * client still fully renders on load for interactivity.
 */
import { renderToString } from 'react-dom/server';
import App from './App';
import { AppProviders } from './providers/AppProviders';
import { FAQS } from './data/faqs';

/** Render the full marketing page to a static HTML string for the <div id="root">. */
export function render(): string {
  return renderToString(
    <AppProviders>
      <App />
    </AppProviders>,
  );
}

/**
 * schema.org FAQPage built from the same copy the page renders, so the structured
 * data search engines and AI agents read can never drift from the visible FAQ.
 */
export function faqJsonLd(): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': 'https://threadwick.com/#faq',
    inLanguage: 'en',
    isPartOf: { '@id': 'https://threadwick.com/#website' },
    mainEntity: FAQS.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a,
      },
    })),
  };
}

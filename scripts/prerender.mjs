// Bakes the homepage's HTML into dist/index.html so search engines, social
// scrapers and AI agents that don't run JavaScript see the real content instead
// of an empty <div id="root">. Runs after `vite build` (client) and
// `vite build --ssr src/entry-server.tsx` (server). The client bundle still
// takes over on load, so users get the full interactive page.
//
// It also (a) asserts the prerendered output actually contains the expected
// content — so a regression fails the build instead of silently shipping an
// empty page — and (b) regenerates dist/sitemap.xml with a fresh <lastmod>.
//
// Run automatically as part of `npm run build`.
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(here, '../dist');
const htmlPath = resolve(distDir, 'index.html');
const sitemapPath = resolve(distDir, 'sitemap.xml');
const serverEntry = resolve(here, '../dist-ssr/entry-server.js');

const { render, faqJsonLd } = await import(pathToFileURL(serverEntry).href);

let html = readFileSync(htmlPath, 'utf8');

// 1) Inject the prerendered app markup into the root container.
const appHtml = render();
const ROOT = '<div id="root"></div>';
if (!html.includes(ROOT)) {
  throw new Error(`prerender: could not find ${ROOT} in dist/index.html`);
}
// Function replacers: string replacements would interpret "$" sequences ($&, $`,
// $$, …) in the rendered markup / JSON, corrupting the output if copy ever has one.
html = html.replace(ROOT, () => `<div id="root">${appHtml}</div>`);

// 2) Inject the data-derived FAQPage JSON-LD just before </head>. Escaping "<"
//    keeps a stray "</script>" in the copy from breaking out of the tag.
const faq = JSON.stringify(faqJsonLd()).replace(/</g, '\\u003c');
const faqScript = `    <script type="application/ld+json">${faq}</script>\n  </head>`;
html = html.replace('</head>', () => faqScript);

// 3) Guard against silently shipping an empty page: the things crawlers and AI
//    agents rely on must actually be present in the output.
const required = [
  'Design your stitches the way you make them', // hero <h1> — render() produced content
  'Everything in one place', // a feature card — deep content, not just the shell
  'Good to know', // FAQ section heading
  '"@type":"FAQPage"', // the FAQ JSON-LD injected in step 2 (not present pre-injection)
];
const missing = required.filter((needle) => !html.includes(needle));
if (missing.length > 0) {
  throw new Error(`prerender: output is missing expected content: ${missing.join(', ')}`);
}

writeFileSync(htmlPath, html);
console.log(`Prerendered ${htmlPath} (${Buffer.byteLength(html)} bytes)`);

// 4) Regenerate the sitemap with a real <lastmod> — the date of the latest commit
//    (what actually changed the site), falling back to the build date.
let lastmod;
try {
  lastmod = execSync('git log -1 --format=%cs', { cwd: here }).toString().trim();
} catch {
  lastmod = undefined;
}
if (!/^\d{4}-\d{2}-\d{2}$/.test(lastmod ?? '')) {
  lastmod = new Date().toISOString().slice(0, 10);
}

const urls = [
  { loc: 'https://threadwick.com/', changefreq: 'monthly', priority: '1.0' },
  { loc: 'https://threadwick.com/studio', changefreq: 'weekly', priority: '0.9' },
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`,
  )
  .join('\n')}
</urlset>
`;
writeFileSync(sitemapPath, sitemap);
console.log(`Wrote ${sitemapPath} (lastmod ${lastmod})`);

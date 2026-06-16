# threadwick-home

The marketing homepage for **Threadwick** — a home for fiber artists and hobbyists — served at
[threadwick.com](https://threadwick.com). Its job is to introduce **Threadwick Studio** (a browser-based
crochet chart designer) and send people to it at `threadwick.com/studio`.

Built to match the Studio: **Vite + React 18 + TypeScript + Ant Design v5**, Iconoir icons, and the
Space Grotesk / Inter type pairing on a terracotta-on-cream palette.

## Develop

```bash
npm install
npm run dev        # local dev server (http://localhost:5173)
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
npm run test       # vitest
npm run build      # typecheck + lint + client build + SSR prerender -> dist/
npm run preview    # serve the production build locally
```

`build` runs the client build, then `prerender` (`build:ssr` + `scripts/prerender.mjs`). The prerender
asserts the output actually contains the expected content, so a regression fails the build instead of
silently shipping an empty page.

## The "Open Studio" link

Every call to action points at `/studio`, resolved in `src/config.ts`:

1. `VITE_STUDIO_URL` — explicit override (e.g. a local Studio dev server / microfrontends proxy)
2. otherwise `/studio` (routed to the Studio by the microfrontends group, see Deploy)

`/studio` only resolves where microfrontends routing exists (production and Vercel previews, or the local
proxy); in a bare `vite dev` it **404s — that's expected**. Use the microfrontends proxy (below) or point
it somewhere real:

```bash
VITE_STUDIO_URL=http://localhost:5173/ npm run dev
```

## Deploy (Vercel Microfrontends)

`threadwick.com` is served as a **microfrontends group**: this repo is the **default app** (serves `/` and
owns the domain), and the Studio is a **child app** mounted at `/studio`. Routing lives in
[`microfrontends.json`](./microfrontends.json) and is handled at Vercel's edge — no manual rewrites.

```jsonc
{
  "applications": {
    "threadwick-home": {},                  // default app: serves / + any unmatched route
    "threadwick-studio": {                  // child app
      "routing": [{ "paths": ["/studio", "/studio/:path*"] }]
    }
  }
}
```

**One-time setup (manual):**

1. Import the Studio repo (`Eiluviann/threadwick`) into Vercel as a project named **`threadwick-studio`**
   — the name must match the key in `microfrontends.json`.
2. In the Studio repo: set Vite `base: '/studio/'` and add the `@vercel/microfrontends` Vite plugin
   (`@vercel/microfrontends/experimental/vite`) so its assets resolve under `/studio`.
3. Vercel → Team **Settings → Microfrontends → Create Group**; add `threadwick-home` (choose it as the
   **default**) and `threadwick-studio`.
4. Attach `threadwick.com` to **threadwick-home only** (a Vercel domain can be on a single project).
5. Deploy both. `/studio` now routes to the Studio at the edge; the homepage CTA (`/studio`) just works.

**Local dev** (both apps on one origin): start each app's dev server, then run the microfrontends proxy
(`npx vercel microfrontends dev`, default port `:3024`). Linked projects in the group resolve
automatically; the default app's `development.fallback` (its `.vercel.app` domain) lets the proxy reach a
deployed app you're not running locally — add one per app to override.

## SEO, social & AI-agent discovery

The page is a client-rendered SPA, so the build **prerenders** the homepage to static HTML — without
it, crawlers and AI agents that don't run JavaScript would see an empty `#root`. `npm run build` runs:

1. `vite build` — the normal client bundle.
2. `npm run prerender` → `build:ssr` (renders `src/entry-server.tsx` to `dist-ssr/`) then
   `scripts/prerender.mjs`, which bakes the rendered markup into `dist/index.html`, injects the FAQ
   structured data, asserts the content is present, and regenerates `dist/sitemap.xml` with a fresh
   `<lastmod>`. The client bundle re-renders the page on load for interactivity (`createRoot`, not
   hydration — so there's no hydration-mismatch risk).

The prerendered HTML is verified two ways: `scripts/prerender.mjs` fails the build if expected content
is missing, and `src/entry-server.test.tsx` asserts the SSR output and FAQ JSON-LD in `npm run test`.

Other discovery assets:

- `index.html` — title/description, Open Graph + Twitter cards, and JSON-LD structured data
  (`Organization`, `WebSite`, `WebApplication`). The `FAQPage` block is generated from
  `src/data/faqs.ts` at build time so it can't drift from the page.
- `public/robots.txt` — welcomes search engines and AI crawlers, grouped by purpose (search / AI
  answer engines / AI training) with a documented one-line opt-out for AI training. Points to the sitemap.
- `public/sitemap.xml` — committed fallback; the build regenerates it (homepage + `/studio`, with a
  real `<lastmod>` from the latest commit date).
- `public/llms.txt` — a plain-language summary of Threadwick for AI agents (see llmstxt.org).
- `public/site.webmanifest` — PWA manifest (name, icons, theme).

The Vite build also splits heavy vendors (`react-vendor`, `antd-vendor`, `icons`) into cacheable chunks
for better Core Web Vitals (see `manualChunks` in `vite.config.ts`).

## Assets

- `public/favicon.svg` — the brand mark.
- `public/og-image.png` — the 1200×630 social card. Regenerate from `public/og-image.svg` with
  `npm run og` (uses `@resvg/resvg-js`).

## Project layout

```
src/
  theme/        design tokens + the Ant Design ThemeConfig (single source of truth)
  providers/    ConfigProvider + IconoirProvider
  styles/       global.css + CSS-variable tokens
  components/   Wordmark, Header, Footer, OpenStudioButton, SectionHeading, Stitch*/GrannyChartMock
  sections/     Hero, DesignApproach, Features, HowItWorks, AccountBand, Faq
  data/         copy + stitch metadata (features, steps, faqs, stitches)
  config.ts     the Open Studio URL
```

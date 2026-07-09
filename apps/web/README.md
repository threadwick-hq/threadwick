# threadwick-web

The Threadwick web app, served at [threadwick.com](https://threadwick.com): the public marketing
homepage for **Threadwick** — a home for fiber artists and hobbyists — plus the next-generation
**Studio** surface being built out at `/studio` (Phase 6 of [`MIGRATION.md`](../../MIGRATION.md)).

A **React Router 7 streaming-SSR** app: React 18 + strict TypeScript, the **`@threadwick/core`**
shadcn-style primitives (on Radix) themed via `tokens.css` + `theme.css`, Tailwind CSS v4,
`@threadwick/icons`, and the Space Grotesk / Inter type pairing on a terracotta-on-cream palette.

## Develop

This app lives in the pnpm workspace; run scripts from the repo root. The `@threadwick/*` packages
export TypeScript source (no build step), so a fresh checkout needs only `pnpm install`:

```bash
pnpm install                                  # once, at the repo root
pnpm --filter threadwick-web dev              # RR7 dev server (http://localhost:5173; pass --port 3000 if the legacy studio holds 5173)
pnpm --filter threadwick-web typecheck        # react-router typegen + tsc --noEmit
pnpm --filter threadwick-web test             # vitest
pnpm --filter threadwick-web build            # react-router build -> build/ (client + server)
pnpm --filter threadwick-web start            # serve the production build (react-router-serve)
```

Gotcha: [`vite.config.ts`](vite.config.ts) dedupes React/React-DOM to a single copy so a dev
re-optimize can't load a second React and break hooks. (The old `optimizeDeps.include` workaround
for the broad `@threadwick/*` barrels is gone — those barrels were split into narrow layer
subpaths, so the dev optimizer no longer re-bundles them mid-session.)

## Routes

Defined in [`app/routes.ts`](app/routes.ts):

- `/` — the marketing homepage (streaming SSR), rendered inside the header/footer chrome of
  `routes/marketing.tsx`. Sections live in `app/components/`.
- `/studio` — the Studio app: a full-takeover, client-only shell (`app/studio/studio-shell.tsx`)
  with its own sidebar and interior chrome. Children render into its outlet: the editor,
  Follow mode (`follow/:projectId/:refId`), project and pattern interiors. Every other
  destination (Workbench, Library, Marketplace, …) is a placeholder until later Phase 6 tasks.

Every marketing call to action points at the internal `/studio` route
([`app/components/open-studio-button.tsx`](app/components/open-studio-button.tsx)).

## Rendering & discovery

Streaming SSR is on (`ssr: true` in [`react-router.config.ts`](react-router.config.ts)), so
crawlers and AI agents that don't run JavaScript get real HTML from the server — no prerender
step. Page titles/descriptions are route-level `meta()` exports.

Static discovery assets in `public/`:

- `robots.txt` — welcomes search engines and AI crawlers, grouped by purpose (search / AI answer
  engines / AI training) with a documented one-line opt-out for AI training. Points to the sitemap.
- `sitemap.xml` — committed static sitemap (homepage + `/studio`).
- `llms.txt` — a plain-language summary of Threadwick for AI agents (see llmstxt.org).
- `site.webmanifest` — PWA manifest (name, icons, theme).
- `favicon.svg` — the brand mark; `og-image.png` — the 1200×630 social card (source: `og-image.svg`).

## Deploy (Vercel Microfrontends)

Production still serves `threadwick.com` as a **microfrontends group**: this app is the
**default app** (serves `/` and owns the domain), and the legacy Studio (`apps/studio`) is a
**child app** mounted at `/studio`. Routing lives in
[`microfrontends.json`](./microfrontends.json) and is handled at Vercel's edge.

This setup is scheduled for retirement: Phase 8 of [`MIGRATION.md`](../../MIGRATION.md) removes
the microfrontends group once this app's built-in `/studio` surface replaces the legacy child
app (which then becomes a standalone offline PWA).

**Local dev** (both apps on one origin): start each app's dev server, then run the
microfrontends proxy (`npx vercel microfrontends dev`, default port `:3024`). Linked projects in
the group resolve automatically; the default app's `development.fallback` (its `.vercel.app`
domain) lets the proxy reach a deployed app you're not running locally.

## Project layout

```
app/
  root.tsx                 document shell + error boundary
  entry.client.tsx entry.server.tsx app.css routes.ts
  routes/                  marketing.tsx (chrome) · home.tsx · studio.tsx + routes/studio/*
  studio/                  the Studio shell: StudioShell, sidebar, interior chrome,
                           stores (studio/pattern/pattern-ownership), editor + follow
                           mounts, capabilities + Ravelry sync seams
  components/              marketing sections (hero, promise, design-approach, roadmap,
                           features, how-it-works, account-band, faq) + header, footer,
                           OpenStudioButton, stitch symbols/legend
  data/                    stitch metadata
  lib/                     create-local-store (useSyncExternalStore-backed local stores)
test/                      app-level vitest suites (more live beside their sources)
```

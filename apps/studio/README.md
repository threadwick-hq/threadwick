# threadwick studio

A **crochet project designer** for the web. Keep every project — its patterns,
the yarns you used, tutorial links and notes — in one folder, and design
**granny-square stitch charts the way you actually crochet them**.

No symmetry maths, no fiddly grids. You pick a start, choose a row, and place
stitches one at a time: each stitch *comes out of* the previous one and is
*worked into* a stitch or a space, exactly like real crochet. Even, readable
charts fall out of that structure instead of out of calculation.

**Live app:** [threadwick.com/studio](https://threadwick.com/studio) — just
visit, no install. Everything saves to your browser, and any project exports to
a file you can back up or share.

## The mental model

Designing should feel like recreating your crochet work. Every stitch records two
things — and that's the whole trick:

- **Origin** — the stitch it comes out of (the working sequence within a row).
- **Base** — the stitch head or the **space** it is worked into (where its
  bottom sits). Spaces are computed automatically as the midpoint between two
  consecutive *real* stitches (chains and slip stitches don't form spaces, so the
  space in `3 dc, ch 2, 3 dc` sits between the flanking dc).

### Placing stitches

1. Pick a **start** (magic ring, double magic ring, chain ring, slip knot). It
   drops in the centre — every stitch ultimately comes from here.
2. Choose the **row** you're working (in the toolbar; only one is active).
3. Enter **Insert** mode (press `I` or any stitch key). The current **origin** is
   highlighted <span>light blue</span>; the orange dots mark the **spaces** you
   can work into.
4. **Click a base** — a stitch head or a space — then **click again to set the
   head**. The bottom of the marker is the base; the top is where you click. Keep
   clicking to chain stitches.

### Inserting between stitches

Hold **Alt / ⌘** and click a stitch to make it the origin. The stitch worked out
of it (the *next stitch*) turns **purple** and everything after it greys out, so
you can see exactly where you're splicing in. Place a stitch and the focus walks
forward one — insert as many as you like.

## Symbols

Standard chart symbols, drawn so you can always see where a stitch begins and how
it lies: chain = oval, slip stitch = dot, sc = cross, hdc = T, dc/tr/dtr = T with
1/2/3 slashes; starts are rings/knots. A **legend** builds itself from the symbols
you use.

## Projects & resources

A project is your folder. It can hold **multiple patterns** (phase 1 implements
the **granny square** type; others are stubbed as "coming soon"), plus shared
**resources**: yarns, links & videos, notes & tips, and variations. **Compose
PDF** lays the whole project out — chart, legend, round-by-round written
instructions and resources — into a print/PDF document.

### Versions

A project keeps an ordered list of **versions**, each with its own patterns and
resources and a status:

- **Draft** — the editable working copy. There's at most one at a time.
- **Published** — the live version (later: the one shared with others). Exactly
  one per project.
- **Outdated** — a previously published version, superseded by a newer one.

**Publish** turns the draft into the published version and marks the previous
published one Outdated. **Edit as new draft** snapshots the published version
into a fresh draft so you can work on the next version without disturbing the
one others rely on. Published and Outdated versions open **read-only**; their
patterns are still viewable. (A dedicated, richer view mode is planned.)

## Run it locally

Studio lives in a pnpm workspace; run scripts from the repo root, and build the
workspace packages once per fresh checkout (`dist/` is gitignored):

```bash
pnpm install
pnpm turbo run build --filter='./packages/*'  # once — builds @threadwick/* deps
pnpm --filter threadwick-studio dev      # Vite dev server (http://localhost:5173/studio/)
pnpm --filter threadwick-studio build    # type-check + lint + production build into dist/studio/
pnpm --filter threadwick-studio preview  # serve the production build (http://localhost:8080)
```

The UI is **React 18** on the **`@threadwick/core`** shadcn-style primitives, in
**strict TypeScript**, built with Vite.

## Exporting

Every project autosaves to your browser; these are the ways out:

- **Project file** — a portable `.threadwick.json`. Import re-adds it as a fresh copy.
- **Export pattern…** (editor hamburger menu) — a dialog to pick a **format**
  (SVG / PNG / Printable PDF) and **settings**: include title, include legend,
  background (white/transparent, SVG & PNG) and PNG resolution (1×–3×).
- **Printable PDF** (project page) — the whole project, print-tailored: every
  pattern's chart and written instructions, plus resources with **links rendered
  as QR codes** and no embedded media (scan from paper). Save as PDF from the
  print dialog.

## Architecture

The chart core is the workspace package
[`@threadwick/editor`](../../packages/editor/README.md) — deliberately
**DOM-free and unit-tested**. This app is the React chrome on top of it, and the
interactive canvas is an imperative controller mounted into React via a ref.

```
@threadwick/editor           framework-agnostic chart core (strict TS, unit-tested):
                               shared domain types · geometry · stitch symbols ·
                               the SVG renderer · the origin/base/space connectivity
                               model · project/pattern factories + migration ·
                               written instructions · the worked sample
@threadwick/editor/browser   browser-only runtime: the localStorage-backed store
                               (data, procedural edits, undo/redo, persistence),
                               files I/O (import/export, SVG/PNG, PDF composer) and
                               the canvas controller (the two-click insert workflow)
src/                         React UI on @threadwick/core primitives
  main.tsx App.tsx useStore.ts icons.tsx index.css
  components/ Glyph Thumb TopBar VersionTag
  editor/CanvasView.tsx        mounts the canvas controller into React
  views/ ProjectsView ProjectView EditorView
  cloud/                       opt-in Supabase auth (AuthMenu, session handling);
                               loaded only when the VITE_SUPABASE_* env vars are set
api/                         Vercel serverless functions (Ravelry userinfo proxy)
```

## Testing

The chart-core suite lives with the model in `@threadwick/editor`; this app's
own suite covers its seams (e.g. the cloud auth wiring).

```bash
pnpm --filter @threadwick/editor test      # the DOM-free chart-core tests
pnpm --filter threadwick-studio test       # this app's tests
pnpm --filter threadwick-studio typecheck  # strict tsc --noEmit
```

## Deployment

The app deploys to **Vercel** as the `threadwick-studio` project, mounted at
**`threadwick.com/studio`** through a
[Vercel Microfrontends](https://vercel.com/docs/microfrontends) group:
`threadwick-home` (a separate repo) is the default app that owns the domain and
serves `/`, and its `microfrontends.json` routes `/studio` and `/studio/:path*`
to this project.

Two pieces of config make the `/studio` mount work — keep them in sync:

- [`vite.config.ts`](vite.config.ts) sets `base: '/studio/'` (every asset URL
  resolves under `/studio/`) and `build.outDir: 'dist/studio'` (the files
  physically nest under `/studio/`, since Vercel serves `dist/`).
- [`vercel.json`](vercel.json) sets `outputDirectory: dist`, rewrites bare
  `/studio` to `/studio/index.html`, and redirects `/` to `/studio/` for visits
  on the project's own Vercel domain.

Pushes to `main` deploy to production; other branches get preview deployments.

## Roadmap

Planned work lives in [`BACKLOG.md`](BACKLOG.md) — including stitch base modes
(explicit / distanced / connected), generating a row from text notation, a
double-click Edit mode, more pattern types, and richer PDF layouts.

## License

Copyright (C) 2026 Eiluviann

threadwick studio is free software: you can redistribute it and/or modify it
under the terms of the **GNU Affero General Public License** as published by the
Free Software Foundation, either version 3 of the License, or (at your option)
any later version. See [`LICENSE`](LICENSE) for the full text.

It is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR
PURPOSE. As a network-served application, anyone running a modified version must
offer its complete source to that version's users (AGPL §13).

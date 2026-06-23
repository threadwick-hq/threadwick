# threadwick studio — project instructions

Guidance for working in this repo. See [`README.md`](README.md) for the full
architecture and mental model.

> **⚠️ Monorepo migration in progress (Phase 6).** This app is being folded into the `threadwick-hq`
> monorepo. Read the root [`CLAUDE.md`](../../CLAUDE.md) and [`MIGRATION.md`](../../MIGRATION.md)
> first — they take precedence where they differ from this file. Key deltas from the guidance below:
>
> - **The chart core moved to [`@threadwick/editor`](../../packages/editor/README.md)** (model,
>   render, store, canvas controller, symbols, files I/O — formerly `src/core/*`).
>   `apps/studio/src/core` no longer exists. The versioning invariants below still hold — they live
>   in `@threadwick/editor` now (`.` = SSR-safe core, `./browser` = client runtime).
> - **Work is tracked as `work/TW-NNN-*.md` files, not GitHub issues** — the "Document all work with
>   GitHub issues" section below is **superseded**. See [`work/README.md`](../../work/README.md) and
>   `pnpm run work next`.
> - **Icons** come from `@threadwick/icons` via `src/icons.tsx`; iconoir is gone. The AntD chrome is
>   mid-migration to shadcn (sub-phase 6c); the AntD notes below apply only until it lands.
> - Run scripts as `pnpm --filter threadwick-studio <script>` from the repo root.

## Core principles

### Brand & values (must-have — see [`docs/BRAND.md`](docs/BRAND.md))

The Studio and the homepage (`Eiluviann/threadwick-home`) are **one product**:
**Threadwick** is the brand, **Threadwick Studio** is this app. The full source
of truth is [`docs/BRAND.md`](docs/BRAND.md); the load-bearing facts:

- **Spine:** "Fair tools for fiber artists & makers." Two audiences: **fiber
  artists** (design & publish) and **makers** (follow patterns, make projects).
  Voice: warm, plain-spoken; no jargon, hype, or urgency tricks.
- **Free-first fairness model:** designing, charting, organizing, exporting,
  accounts, cloud sync & backup, sharing, and license-key sales the artist
  transacts themselves are **free, always**. The **only** paid surface is when
  Threadwick processes a sale for an artist (marketplace / buy-via-link), with
  small, flat, transparent, artist-majority fees. **Makers never pay
  Threadwick anything, ever.** Never paywall core tools or account/sync/backup;
  no dark patterns.
- **Vocabulary:** Project → Pattern (Draft/Published/Outdated) → **Chart**
  (say "chart", not "graph"), worked in rounds; project resources are
  **yarns, links, notes, variations**. It's **Ravelry** (never "Raverly"), and
  the old name "stitchgrid" must not reappear (sole exception: the legacy
  localStorage migration key).
- **Stitch terminology:** US **and** UK names are both supported
  (`stitchName`/`stitchAbbr` in `src/core/symbols.ts`); data stores symbol
  types, never convention-specific names.
- **Identity:** this repo owns the logo/palette/type tokens — if they change,
  flag the homepage to follow. Hold WCAG AA: primary buttons use `#a64e30`
  (white on `#c2603f` is sub-AA), muted text uses `#6b675f` (not `#8a8275`).
- **Roadmap honesty:** never show fake/unavailable features in-app; when a
  planned feature ships, the homepage moves it out of "What's on the hook".

### Data ownership & portability (must-have, non-negotiable)

Users own their data. The app must never become a place where data goes in but
can't come out — **no ecosystem lock-in.**

- **Everything is exportable.** Every kind of user-created data (projects,
  versions, patterns, stitches, resources — and anything added later) must have
  an export path. Never ship a data type that can only live inside the app.
- **Friendly, open formats.** The canonical export is **human-readable JSON**:
  the portable project file (`ProjectFile` → `projectToFile` / `projectFromFile`
  in [`src/core/model.ts`](src/core/model.ts)). Renders also export to standard,
  non-proprietary formats (SVG, PNG, print/PDF). No opaque, encrypted-only, or
  proprietary container formats.
- **Lossless & round-trippable.** Anything exported must re-import and reproduce
  the same data. Treat `export → import → deep-equal` as the bar, and cover it
  in [`test/core.test.ts`](test/core.test.ts).
- **Export _all_ data, not just one item at a time.** The whole library lives in
  `localStorage` via `store.serialize()` ([`src/core/store.ts`](src/core/store.ts)).
  Keep a full-library / "export everything" path available and current so a user
  can walk away with 100% of their data in one action.
- **Evolve the format deliberately.** When you add or change stored data, in the
  **same change**: extend the portable format, bump `FILE_VERSION`, and add a
  migration in `normalizeProject` so old exports still import. Export + import +
  migration ship together — never separately.

When designing any feature, ask "how does a user get this data out, in a format
they can use elsewhere?" before building it. If there isn't a clean answer, the
design isn't done.

### Document all work with GitHub issues (must-have)

Every piece of work — features, fixes, refactors, and stories scheduled for
later — **must be documented as a GitHub issue** in this repository:

- Before implementing, make sure an issue exists for the story (create one if
  it doesn't), with acceptance criteria where known.
- Reference issues from commits (`Refs #N`) and close them via the pull
  request (`Closes #N`); a multi-story PR keeps an issue checklist in its
  description.
- Stories described for later development get **placeholder issues** marked
  "do not implement yet", so the backlog lives in the issue tracker.

## Dev commands

- `npm run dev` — local dev server
- `npm run build` — production build (also the deploy gate)
- `npm test` — unit tests (vitest, `test/core.test.ts`)
- `npx tsc --noEmit` — typecheck
- `npx eslint .` — lint

Run typecheck, lint, tests, and build before pushing.

## Where things live

The chart core was extracted to **`@threadwick/editor`** (Phase 6, TW-010/011/012) — these moved:

- **Portable file format + migration:** `model.ts` — `@threadwick/editor`
- **Import / export, SVG / PNG, print-PDF:** `files.ts` — `@threadwick/editor/browser`
- **Store + `localStorage` persistence:** `store.ts` — `@threadwick/editor/browser`
- **Domain types:** `types.ts` — `@threadwick/editor`
- **Stitch symbols (US/UK terms):** `symbols.ts` — `@threadwick/editor`

What remains in `apps/studio/src`: the React chrome (`views/`, `components/`, `editor/CanvasView`),
cloud/auth (`cloud/`), and the `icons.tsx` shim. See
[`packages/editor/README.md`](../../packages/editor/README.md).

## Versioning model (invariants)

A `Project` owns `versions[]` + `activeVersionId`; **patterns and resources live
inside a `ProjectVersion`, not on the project.** See the README "Versions"
section for the user-facing behaviour. Hold these invariants when touching it:

- **At most one `draft` and at most one `published`** version per project.
  Publishing a draft outdates the prior published one (`store.publishVersion`).
- **Only a draft is editable.** Every mutation routes through the active version
  and is guarded by `isDraftActive()` in the store — published/outdated versions
  are read-only at the **data layer**, not just hidden in the UI. New
  pattern/resource/editor mutations must go through the active version and
  respect this guard.
- **Read patterns/resources via `activeVersion(prj)`** (or `store.currentVersion()`),
  never `prj.patterns` / `prj.resources` (those no longer exist).
- **`createDraft` snapshots** the published (or active) version with **fresh ids**
  for the new version and its patterns — so a stale editor `patternId` won't
  resolve; it steps back to the project view on purpose.
- **Migration:** `normalizeProject` wraps any legacy `{ patterns, resources }`
  project into a single draft version and enforces a single published version.

## Roadmap & known gaps

- **View mode (planned, large):** a dedicated, richer read-only experience for
  viewing projects is coming. The read-only editor here is intentionally minimal
  — build the real viewer on top of `activeVersion` / `publishedVersion` /
  `setActiveVersion` and the status model rather than expanding the editor.
- **Sharing (next):** share a project's *published* version with other users;
  the version model is the foundation for it.
- **Export-everything gap:** per-project JSON export exists, but there's **no
  one-click "export all projects" yet** (the whole library is already available
  via `store.serialize()`). Wiring this — plus matching import and a round-trip
  test — is the outstanding item for the data-ownership principle above.

## Gotchas

- **Editor CSS grids.** `.editor` is a row grid (`auto auto 1fr`) and `.ed-body`
  a 3-column grid (`220px 1fr 286px`). Conditionally adding/removing a direct
  child (e.g. the read-only banner, or hiding the left palette) silently breaks
  the tracks. Use modifier classes (`.editor.has-banner`, `.ed-body.readonly`)
  instead of removing grid children blind.
- **Verifying UI changes.** `npm run build` then `npx vite preview --port <p>`,
  and drive it headless with puppeteer — seed/inspect state via
  `window.threadwick.store`, and screenshot. Name scratch scripts `_*.mjs`
  (gitignored) and delete them after; never `git add -A` them into a commit.
- **antd is v5** (`5.29.3`); the MCP server is pinned to v5 docs in `.mcp.json`.
  Prefer current v5 APIs (`variant`, `destroyOnHidden`, `menu={{items}}`,
  `styles={{body}}`, `App.useApp()`), not the deprecated ones.

# Threadwick — monorepo + RR7 + shadcn migration plan

Ordered, gated plan to move from six worktree-polyrepos to one monorepo with a single React Router 7
app, an offline PWA, all-AGPL licensing, and a shadcn/Tailwind UI on the existing OKLCH design system.

**Working rule:** every phase ends *green* — `pnpm install`, `turbo typecheck`, and `turbo build`
must pass before the next phase starts. Phases 0–1 are destructive; nothing runs without an explicit
go. History is preserved via `git subtree` (no `--squash`).

**Tracking:** this document is the narrative plan. The actionable tasks inside each phase live in
[`work/`](work/README.md) as `TW-NNN` files; a task's `phase:` field maps it back here.

---

## Locked decisions (the target)

- **Monorepo:** pnpm workspaces + Turborepo. Six repos imported via `git subtree` from each repo's
  `main`, history preserved. Source checkouts staged in a **sibling dir** first to avoid embedding
  their `.git` in the new repo.
- **Licensing:** entire project **AGPL-3.0-or-later**, one root `LICENSE`. `CLA.md` + `CONTRIBUTING.md`
  at root (already drafted).
- **App:** one **React Router 7** framework-mode app (`apps/web`) with **streaming SSR** — marketing +
  marketplace + Studio editor + Viewer. SSR/SSG for public/SEO routes, client nav everywhere else.
- **Editor:** factored into **`packages/editor`**, mounted in `apps/web` as a **client-only,
  offline-capable** route, and reused by the standalone offline PWA **`apps/studio`**.
- **UI:** **shadcn/ui** (Radix primitives + **Tailwind v4**), copy-in components owned in
  **`@threadwick/core`**, themed from the OKLCH `tokens.css`. **Ant Design dropped.**
- **Icons:** **`@threadwick/icons`** — single semantic `<Icon name>` interface; **FA Pro default + FA
  Free fallback** (Vite alias on `HAS_FA_PRO`); FA Free is the installable baseline so token-less
  builds work. Iconoir removed.
- **Tooling:** **Biome** (one tool for lint + format, replacing ESLint + Prettier); one lockfile.
  Design-system guardrails (no-raw-hex / off-grid / missing-aria) live in `scripts/validate.ts`, not
  the linter. Type-aware rules deferred to strict `tsc`.

## Target layout

```
threadwick-hq/                     (fresh git repo)
├── LICENSE  CLA.md  CONTRIBUTING.md  NOTICE  README.md
├── package.json  pnpm-workspace.yaml  turbo.json  .npmrc  .gitignore
├── .github/workflows/ci.yml
├── packages/
│   ├── config/      @threadwick/config — tsconfig + biome.json + tailwind base
│   ├── types/       @threadwick/types — Pattern model + pattern.schema.json
│   ├── icons/       @threadwick/icons — semantic Icon interface (fa-pro / fa-free adapters)
│   ├── core/        @threadwick/core — OKLCH tokens + Tailwind preset + shadcn components + brand
│   ├── editor/      @threadwick/editor — chart editor + viewer (framework-agnostic, client-only)
│   └── org/         @threadwick/org — typed canon
└── apps/
    ├── web/         RR7 framework-mode app (streaming SSR): marketing + marketplace + /studio + viewer
    └── studio/      standalone offline PWA shell around @threadwick/editor (cloud feature-gated off)
```

---

## Decisions still needed before Phase 0

1. **Branch triage** — which unmerged remote branches to keep (subtree captures `main` only). Known:
   studio `claude/brand-spacing` (+3), plus a few +1 studio/home branches. Name them and they get
   merged to `main` before import; otherwise they remain only in the old GitHub repos.
2. **FA Free fallback wiring** — confirmed approach: FA Free = installable baseline, FA Pro layered via
   `FONTAWESOME_NPM_AUTH_TOKEN`. (No further input needed unless you want to skip the fallback.)
3. **Rescue scope** — default is to commit *all* untracked work to a `wip/rescue` branch (see Phase 1);
   confirm if anything should instead be discarded.

---

## Phase 0 — Root init + governance  ·  *mechanical*

**Goal:** a valid committed monorepo root before any subtree import.

1. Stage the six source checkouts OUT of the target dir to avoid embedded `.git`:
   move each repo's `main` checkout to a sibling `../threadwick-src/<name>/` (handle `home`'s worktrees
   in Phase 1 first if they block the move).
2. `git init` the fresh monorepo at `threadwick-hq/`.
3. Root `LICENSE` ← `org`'s AGPL text; keep `CLA.md` + `CONTRIBUTING.md`; add `NOTICE` (FA Free CC-BY
   attribution placeholder), `README.md`, `.gitignore` (`node_modules dist dist-ssr .turbo build
   .DS_Store .react-router`).
4. Commit the governance base.

**Verify:** `git rev-parse --show-toplevel` = `threadwick-hq`; `LICENSE/CLA.md/CONTRIBUTING.md` tracked.

---

## Phase 1 — Subtree imports (history preserved)  ·  *mechanical, careful*

**Goal:** all six repos under `packages/*` + `apps/*` with full history; nothing lost.

1. **Rescue first** (these are on no branch/remote — destroyed if skipped): commit `home`'s
   `research/monetization/` and the `home/claude/clever-galileo-64PJu` experiment (handoff docs,
   `src/concept/*`, memory snapshot) to a `wip/rescue` branch in their source repos.
2. **Branch triage:** merge any wanted unmerged branches into each repo's `main`.
3. `git worktree remove` the `home/wire-core` + `clever-galileo` worktrees cleanly.
4. Subtree-import each repo's `main` from the sibling staging dir, no squash:
   ```
   git subtree add --prefix=packages/config ../threadwick-src/config main
   git subtree add --prefix=packages/types  ../threadwick-src/types  main
   git subtree add --prefix=packages/core   ../threadwick-src/core   main
   git subtree add --prefix=packages/org    ../threadwick-src/org    main
   git subtree add --prefix=apps/studio     ../threadwick-src/studio main   # editor extracted to packages/editor in Phase 6
   git subtree add --prefix=apps/web        ../threadwick-src/home   main   # becomes the RR7 app in Phase 5
   ```
   (Import `home`'s `main` ref — its working checkout is on a stale branch; `main` already carries the
   AGPL + core-wiring commits.)
5. Delete the per-package `package-lock.json` (6 files) as a post-import commit.

**Verify:** all prefixes populated; `git log -- apps/web` shows the AGPL/core-wiring commits; tree clean.

---

## Phase 2 — Workspace scaffold + icons  ·  *mechanical*

**Goal:** one installable, building workspace.

1. Root `package.json` (private, `packageManager: pnpm`, devDeps `turbo` + `typescript`),
   `pnpm-workspace.yaml` (`packages/*`, `apps/*`), `turbo.json` (`build`/`typecheck`/`lint`/`test`,
   `build` dependsOn `^build`).
2. Convert cross-package `file:` deps to `workspace:*`.
3. **Biome:** remove all `eslint`/`prettier` configs + deps from every package; add one root
   `biome.json` (from `js-style-init`). This *eliminates* the ESLint v9-vs-v10 skew entirely — no
   reconciliation needed. Move the bespoke design-system checks into `scripts/validate.ts`.
4. **`@threadwick/icons`:** create the package — `Icon` component + `IconName` union + `fa-pro` /
   `fa-free` adapters; FA Free as normal deps, FA Pro via `.npmrc` (`FONTAWESOME_NPM_AUTH_TOKEN`) as
   optional/guarded; Vite alias swaps Pro↔Free on `HAS_FA_PRO`.
5. `pnpm install` (one lockfile).

**Verify:** single `pnpm-lock.yaml`; `turbo build typecheck lint` green; token-less install still works
(Free path); `studio→core` resolves as `workspace:*`.

---

## Phase 3 — Shared config + CI  ·  *mechanical*

**Goal:** one tsconfig/eslint/prettier + Tailwind base via `@threadwick/config`; one CI.

1. Point every package at `@threadwick/config` (tsconfig extends, shared `biome.json`); add a shared
   Tailwind base preset here. Wire `scripts/validate.ts` (no-raw-hex / off-grid / missing-aria) into CI
   as the design-system conformance gate.
2. One root `.github/workflows/ci.yml` (install → build → typecheck → lint → test). The four nested
   `prune-merged-branches.yml` are inert under `packages/*/.github` — delete as optional hygiene.

**Verify:** `turbo build typecheck lint` still green; one root `LICENSE`; zero non-AGPL `license` fields.

---

## Phase 4 — Design system: tokens + Tailwind + shadcn in `@threadwick/core`  ·  *medium*

**Goal:** the shadcn component layer themed from OKLCH, replacing the AntD theme.

1. **Remove** `core/src/theme/antd.ts` and the `antd` peer/dev dep. Keep `tokens/` (OKLCH), palette,
   contrast gate, `Stack`, brand — all framework-agnostic, untouched.
2. Add **Tailwind v4** to core; map `tokens.css` OKLCH custom properties → the CSS-var names shadcn
   expects (`--background`, `--foreground`, `--primary`, …). 8px grid → Tailwind spacing.
3. `npx shadcn init` into core; copy in the base set used by home + studio: Button, Input, Card, Badge,
   Dialog, DropdownMenu, Select, Tooltip, Tabs/Segmented, Alert, Separator, Breadcrumb, Empty/placeholder.
   Restyle to Brick & Ecru "paper-like"; set **44px** min target + the `--tw-focus` ring as defaults.
4. ColorPicker (editor, 1 site) → **React Aria** ColorPicker styled to tokens.
5. Export the components + the Tailwind preset from `@threadwick/core`.

**Verify:** core builds; a kitchen-sink page renders Brick & Ecru correctly (OKLCH, incl. P3); contrast
gate passes; AA/44px hold by default.

---

## Phase 5 — RR7 app + marketing port (streaming SSR)  ·  *large*

**Goal:** `apps/web` on RR7 framework mode, streaming, with marketing as SSG/SSR routes.

1. Scaffold the RR7 framework-mode app (Vite); wire Tailwind + `@threadwick/core` + `@threadwick/icons`.
2. Confirm **streaming SSR** (`renderToPipeableStream`) — plain Tailwind CSS streams natively; **no
   cssinjs extraction needed** (this deletes the migration's old biggest risk).
3. Port `home` sections/components into RR7 routes (`/`, future `/explore`, `/p/:slug`); migrate home's
   AntD usage → shadcn; replace the hand-rolled `entry-server.tsx` + `prerender.mjs` with framework
   SSG/SSR; delete them and rewrite their coupled tests as route tests **in the same commit**.

**Verify:** marketing routes server-render with styles inline (no FOUC, no hydration mismatch); meta /
JSON-LD / FAQ intact; old SSR machinery + tests gone; `turbo build` green.

---

## Phase 6 — Studio app surface: editor extraction, client-only shell, and the Follow view  ·  *large (the redesign-heavy phase)*

**Goal:** the chart editor extracted into `packages/editor` (AntD-free, SSR-safe), mounted as a
client-only `/studio` sub-tree in `apps/web` inside a real navigation shell, with the priority maker
surface — the **Follow view** — built on a maker-plane Project/progress model. The redesign
(`apps/studio/docs/redesign/spec.md` §1–§8) turns this from "lift-and-mount the editor" into "stand up
the Studio app." Tracked as `work/` tasks **TW-010..TW-049**. Parallelizable with Phase 7; it
front-loads Phase 7's maker-plane model increment.

Runs as five sub-phases. Every stored-shape change bumps `FILE_VERSION` + adds a `normalizeProject`
migration (both `threadwickstudio:v2` and legacy `stitchgridstudio:v2`) + keeps the export → import →
deep-equal round-trip green, in the same PR. `SAVE_KEY` never changes. Cards use photos, never chart
snapshots. Every networked feature sits behind a runtime capability flag so the offline PWA (Phase 8)
stays complete.

- **6a — Core extraction (no model change)** · *TW-010..013, 018.* Scaffold `packages/editor` (ESM,
  tsup, browser-only subpath). Move the DOM-free core (`model/types/symbols/render/connectivity/…` +
  `core.test.ts`) verbatim behind a barrel that also exports the read primitives the Follow view needs
  (`chainOrder`, `summarizeRound`, `chartToSVG`/`stitchToSVG`). Then move `store.ts` + `editorCanvas.ts`
  + `files.ts` behind the **browser-only** entry so no `document`/`window`/`localStorage` reaches SSR.
  Ships the v3 model intact — flags, does not migrate, the model seam. Add the editor's ~34 action
  glyphs to `@threadwick/icons`; drop iconoir. Biome-clean the moved code and drop the `|| true` (folds
  TW-007).
- **6b — Client-only shell + mount** · *TW-019..025 (supersedes the old TW-004).* Mount `/studio*`
  strictly client-only (clientLoader only, `HydrateFallback`; supabase + `cloud/*` behind `import()`).
  Build `StudioShell` (UWD cap-and-centre), the always-expanded sidebar (sections + counts + active),
  the craft picker (studio-wide persisted scope in its own key, inclusion semantics), the topbar
  (⌘K shell, bell, Import/New), the mobile bottom tab bar, and the identity-tile slot-swap contract.
- **6c — Editor chrome AntD → shadcn** · *TW-014..017 (parallel with 6b).* Rebuild EditorView,
  ProjectView/TopBar, AuthMenu on `@threadwick/core` shadcn; replace `App.useApp()` with a toast+confirm
  layer (8 `message.*` + 6 `modal.confirm`); 3 forms → react-hook-form; then delete AntD. Hold the
  editor CSS-grid gotcha (modifier classes; never add/remove grid children).
- **6d — Maker-plane model + Follow view (priority feature; Phase-7 increment)** · *TW-026..032.* Land
  the maker-plane `Project` (pattern refs + source tags, per-pattern follow mode, status union + Ravelry
  mapping, progress cursor) in `@threadwick/types` — the first increment of Phase 7, co-designed. Build
  the pure **instruction-decomposition engine** (round → follow Units at per-row/pattern/granular, from
  **explicit** repeat/corner marks with a per-row fallback) and the **Follow progress state machine**
  (one-big-action cursor, Undo, aggregation; this is the `FILE_VERSION` 3→4 bump). Then the Follow
  instruction box, chart pane, the locked-responsive shell across five breakpoints + Wake Lock, and the
  external-pattern checklist fallback.
- **6e — List + interior + library/marketplace screens** · *TW-033..047.* Home (recents read model,
  Continue + recents shelf, decouple flag), Workbench Patterns/Projects lists, Pattern interior
  (edit+view, versioning types anchored for Phase 7, reward-never-penalize quality checks), Project
  interior + Overview, Library (Yarns/Tools/Patterns over a top-level stash model + decouplable Ravelry
  seam, fixture seed for now), Marketplace (Home/Browse behind a `MarketplaceGate` capability flag).
  Pin Supabase `redirectTo` (TW-048); audit hardcoded `/studio/` asset paths (TW-049).

**Model seam (decided):** ship v3 intact in 6a; land **only** the maker-plane subset in 6d (the first
Phase-7 increment); the full Pattern-as-versioned-root re-seating (publish/draft engine altitude,
remix/lineage, unpublish/ownership) is **deferred to Phase 7**, with only its types anchored in 6e
(TW-035). One owner decides the canonical version primitives; the maker-plane and pattern-versioning
types are co-designed against one `@threadwick/types` sequence, never forked.

**Verify:** `/studio` strictly client-only (no `window`/`localStorage` in the server bundle; supabase
absent from SSR + initial bundle); the shell renders with sidebar/craft-picker/topbar; the editor loads,
store seeds + autosaves, `window.threadwick` inspectable; the Follow view drives a project to completion
on phone + desktop with progress persisting through an export → import round-trip; marketing routes
still SSR; `pnpm check` green.

---

## Phase 7 — Model unification onto `@threadwick/types`  ·  *large, data-integrity*  ·  *parallel with 8*

**Goal:** studio's chart-geometry model reconciled with the shared authoring Pattern, losslessly.

1. Fill the empty `ChartData`/`SchematicData` in `packages/types` with studio's stitch/round geometry;
   mirror in `pattern.schema.json` (fail-closed).
2. Wire `apps/studio` + `packages/editor` to `@threadwick/types`; resolve the `Pattern` name collision
   deliberately (authoring vs chart-geometry layers).
3. **Bump `FILE_VERSION`**; extend `normalizeProject` to migrate existing `threadwickstudio:v2` **and**
   legacy `stitchgridstudio:v2` data. Ship the migration **with** an export→import→deep-equal
   round-trip test, in the same change.

**Verify:** round-trip passes; both legacy keys migrate; schema validates a real chart; green build.

---

## Phase 8 — Standalone PWA + retire microfrontends  ·  *mechanical*  ·  *parallel with 7*

**Goal:** `apps/studio` as a self-host offline PWA; Vercel Microfrontends removed.

1. `apps/studio` = thin PWA shell around `@threadwick/editor`; base `/`; add service worker + manifest
   (offline app-shell caching). Build **without** `VITE_SUPABASE_*` → `cloudEnabled=false` → no Supabase
   code bundled; marketplace/sync/auth feature-gated off.
2. **Remove** `@vercel/microfrontends`, `microfrontends.json`, and studio's `vercel.json` rewrites —
   `/studio` is now an internal RR7 route. Define the single-origin deploy config for `apps/web`.

**Verify:** PWA installs, works offline, no `@supabase` chunk; `apps/web` has no microfrontends config;
`/studio` resolves as an internal RR7 route.

---

## Verification gates (between phases)

- **0→1** root is a git repo; governance files committed.
- **1→2** all prefixes populated; history merged (not squashed); rescued work safe; tree clean.
- **2→3** one lockfile; `turbo build/typecheck/lint` green; token-less (FA Free) install works.
- **3→4** config standardized; one AGPL `LICENSE`; CI green.
- **4→5** core renders Brick & Ecru via shadcn/Tailwind (OKLCH + P3); contrast/AA/44px hold.
- **5→6** marketing streams SSR cleanly; old SSR machinery + tests removed.
- **6→7/8** `/studio` strictly client-only/offline; marketing still SSR.
- **7 exit** round-trip + dual-key migration pass.
- **8 exit** offline PWA works with no cloud chunk; microfrontends config gone.

## Corrected non-issues (don't chase these)

- The four `prune-merged-branches.yml` workflows **don't collide** — inert under `packages/*/.github`.
- **No history bloat** from committed `node_modules`/`dist` (gitignored); only 6 small `package-lock.json`.
- Importing `store.ts` is **SSR-safe**; the isolation point is `editorCanvas` + the `main.tsx` bootstrap.
- AntD's cssinjs SSR problem is **gone** — shadcn/Tailwind emits plain CSS that streams natively.

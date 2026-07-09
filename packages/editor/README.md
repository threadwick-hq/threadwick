# @threadwick/editor

The framework-agnostic **chart-editor core**: the data model, SVG renderer, stitch
connectivity, symbols, the local-first store, and the imperative canvas controller that power
the Studio editor and the Follow view. Extracted from `apps/studio` in Phase 6 (TW-010/011/012)
so both `apps/web` (the client-only `/studio` route) and `apps/studio` (the offline PWA) consume
one source.

No React, no UI: this package is **headless**. React adapters (e.g. the `CanvasView` mount) live
in the apps, against the controller and store exported here.

## Two entry points — the SSR-safe split

The package is source-exported (no build step; consumers bundle the TS) with two deliberate
entries:

| Import | Contains | Safe in SSR? |
|---|---|---|
| `@threadwick/editor/chart` | the **pure core**: `model`, `render`, `connectivity`, `symbols`, `geometry`, `util`, `colors`, `codec`, and read primitives (`chainOrder`, `spacesForRound`, `chartToSVG`/`stitchToSVG`) | **yes** — no DOM, no `localStorage`, no React, nothing executes at import |
| `@threadwick/editor/follow` | the Follow-view read-side (`summarizeRound`, follow UI/chart, decomposition, progress, pattern/project overview, versioning, view-mode, recents) | **yes** |
| `@threadwick/editor/fixtures` | `sample*` demo data | **yes** |
| `@threadwick/editor/browser` | the **client runtime**: the `localStorage`-backed `store`, the imperative `editorCanvas` controller (`initCanvas`), and `files` (import/export, SVG/PNG, print-PDF) | client only |

```ts
// SSR / Follow view — read-only rendering:
import { chartToSVG, activeVersion } from '@threadwick/editor/chart';
import { summarizeRound } from '@threadwick/editor/follow';

// /studio editor — the editing runtime (client-only route):
import { store, initCanvas, exportProjectFile } from '@threadwick/editor/browser';
```

The split is what lets `apps/web` mount `/studio` client-only without dragging DOM/`localStorage`
into the streaming-SSR marketing bundle. The `chart`/`follow`/`fixtures` subpaths expose no
`store`/`initCanvas` — that separation is the contract; don't let a core module pull in browser
code. (There is no root `.` entry; consumers import a layer subpath.)

## Versioning model (invariants — hold these)

A `Project` owns `versions[]` + `activeVersionId`; **patterns and resources live inside a
`ProjectVersion`, not on the project.**

- **At most one `draft` and one `published`** version per project. Publishing a draft outdates the
  prior published one (`store.publishVersion`).
- **Only a draft is editable** — every mutation routes through the active version and is guarded by
  `isDraftActive()` at the data layer, not just hidden in the UI.
- **Read via `activeVersion(prj)`** (or `store.currentVersion()`), never `prj.patterns`.
- **`normalizeProject`** wraps any legacy `{ patterns, resources }` project into a single draft
  version and tolerates junk input (it is the migration boundary, hence the `any` there).
- **Data ownership:** the portable `ProjectFile` (`projectToFile` / `projectFromFile`) round-trips
  losslessly — `export → import → deep-equal` is covered in `test/`. When you change a stored shape,
  bump `FILE_VERSION` + add a `normalizeProject` migration + keep the round-trip green, in the same
  change. `SAVE_KEY` (`threadwickstudio:v2`) never changes.

This ships the existing **v3 model intact**. The redesign's Pattern-as-versioned-root / maker-plane
`Project` shift is **Phase 6d + Phase 7** (`@threadwick/types`), not here — see
[MIGRATION.md](../../MIGRATION.md).

## Scripts

- `pnpm --filter @threadwick/editor typecheck`
- `pnpm --filter @threadwick/editor test` — Vitest (`test/core.test.ts` DOM-free core,
  `test/store.test.ts` store + version lifecycle), runs in plain Node.
- `pnpm --filter @threadwick/editor lint` — Biome. 0 errors; ~160 warn-level diagnostics remain
  (the core's `!` indexed-access idiom + canvas-controller complexity) — left deliberately.

## License

AGPL-3.0-or-later © Threadwick.

# AGENTS.md — Threadwick Studio

Read [README.md](README.md) for architecture. This file is the scoped source of truth when working
under `apps/studio/`.

**Also read:** root [AGENTS.md](../../AGENTS.md), [docs/BRAND.md](docs/BRAND.md),
[MIGRATION.md](../../MIGRATION.md).

Legacy studio chrome (Phase 6 migration). **Precedence:** root [AGENTS.md](../../AGENTS.md) +
[MIGRATION.md](../../MIGRATION.md) win on conflict.

## Phase 6 deltas

- Chart core is [`@threadwick/editor`](../../packages/editor/README.md) — `apps/studio/src/core` is gone.
- Icons: `@threadwick/icons` via `src/icons.tsx` (iconoir removed).
- Chrome is `@threadwick/core` shadcn primitives (sub-phase 6c complete; AntD removed in TW-017/#63).
- Run scripts: `pnpm --filter threadwick-studio <script>` from repo root.

## Brand & values

Full source: [docs/BRAND.md](docs/BRAND.md).

- Spine: "Fair tools for fiber artists & makers."
- Free-first: core tools, sync, export always free; only marketplace processing is paid.
- Makers never pay Threadwick. No dark patterns.
- Vocabulary: Project → Pattern → **Chart** (not "graph"); **Ravelry** (never "Raverly").
- Never resurrect "stitchgrid" anywhere (the legacy key migration was removed pre-release).
- WCAG AA: primary `#a64e30`; muted text `#6b675f`.

## Data ownership (non-negotiable)

- Everything exportable; canonical format is human-readable JSON (`@threadwick/editor` model).
- Export → import → deep-equal is the bar; cover in tests.
- **Pre-release format policy:** until the app ships, breaking format changes may change the
  shape in place — bump `FILE_VERSION`, no migration; retired shapes are rejected, not
  upgraded (`projectFromFile` accepts only the current-version envelope). The
  bump-plus-migration discipline resumes at release.

## Where things live

| Was | Now |
| --- | --- |
| model, types, symbols | `@threadwick/editor` |
| store, files I/O | `@threadwick/editor/browser` |
| React chrome, cloud, CanvasView | `apps/studio/src` |

## Versioning invariants

- Patterns/resources live in `ProjectVersion`, not on `Project`.
- At most one `draft` and one `published` per project.
- Only draft is editable (`isDraftActive()` guard at data layer).
- Read via `activeVersion(prj)` / `store.currentVersion()` — never `prj.patterns`.

## Gotchas

- Editor CSS grids: use modifier classes (`.editor.has-banner`), don't remove grid children.
- Feedback (toasts + confirms) is the core `FeedbackProvider` layer (`toast.*` / `confirm()` from
  `@threadwick/core/ui`) — never a per-view dialog state machine.

## Dev commands

```sh
pnpm --filter threadwick-studio dev      # port 5173 → http://localhost:5173/studio/ (bare / 404s)
pnpm --filter threadwick-studio build
pnpm --filter threadwick-studio test
```

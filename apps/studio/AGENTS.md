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
- AntD chrome → shadcn (sub-phase 6c); AntD notes below apply until migration lands.
- Run scripts: `pnpm --filter threadwick-studio <script>` from repo root.

## Brand & values

Full source: [docs/BRAND.md](docs/BRAND.md).

- Spine: "Fair tools for fiber artists & makers."
- Free-first: core tools, sync, export always free; only marketplace processing is paid.
- Makers never pay Threadwick. No dark patterns.
- Vocabulary: Project → Pattern → **Chart** (not "graph"); **Ravelry** (never "Raverly").
- Never resurrect "stitchgrid" except the legacy localStorage migration key.
- WCAG AA: primary `#a64e30`; muted text `#6b675f`.

## Data ownership (non-negotiable)

- Everything exportable; canonical format is human-readable JSON (`@threadwick/editor` model).
- Export → import → deep-equal is the bar; cover in tests.
- Format changes: bump `FILE_VERSION`, add migration in `normalizeProject`, ship together.

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
- antd v5: prefer `variant`, `destroyOnHidden`, `menu={{items}}`, `App.useApp()`.
- Ant Design MCP: configured in [`.mcp.json`](.mcp.json) (studio-local) and the repo-root
  [`.mcp.json`](../../.mcp.json).

## Dev commands

```sh
pnpm --filter threadwick-studio dev      # port 5173 → http://localhost:5173/studio/ (bare / 404s)
pnpm --filter threadwick-studio build
pnpm --filter threadwick-studio test
```

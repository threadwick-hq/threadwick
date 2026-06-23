---
id: TW-012
title: Move files.ts (import/export, SVG/PNG, print-PDF) into the editor browser-only entry
type: refactor
area:
  - packages/editor
  - apps/studio
phase: 6
status: active
priority: p2
created: 2026-06-23
assignee: agent
started: 2026-06-23
acceptance:
  - files.ts lives behind the browser-only entry; SSR never imports it
  - export -> import -> deep-equal round-trip stays green
  - studio import/export/print behaviour unchanged
---

## Context

files.ts owns import/export JSON, SVG/PNG export, and the print-PDF composer (qrcode). DOM download/print helpers, browser-only. (Phase 6 sub-phase 6a.) From the Studio redesign handoff at `apps/studio/docs/redesign/`.

## Scope

In: Move files.ts DOM helpers (import/export download, SVG/PNG, print-PDF) into the browser-only subpath; the pure summarizeRound already moved to the core in TW-010. Keep the export->import->deep-equal round-trip covered by the moved test. Re-point apps/studio.

Out: No format change; data-ownership round-trip must stay lossless.

Depends on: TW-010.

## Acceptance

- [x] files.ts lives behind the browser-only entry (folded into ./browser); SSR never imports it (the `.` core barrel does not export it)
- [x] export -> import -> deep-equal round-trip stays green (model.ts round-trip test passes; 30 editor tests)
- [x] studio import/export/print behaviour unchanged (typecheck + tests + eslint clean)

## Log

- 2026-06-23 created (Phase 6 re-scope from the studio redesign handoff).
- 2026-06-23 implemented. git-moved files.ts (import/export, SVG/PNG, print-PDF) into
  packages/editor/src, re-pointing its core imports to the relative `./index` barrel and folding its
  exports into `./browser`. Moved the qrcode dependency (and @types/qrcode) from apps/studio into the
  package. Re-pointed the three studio views (ProjectsView/ProjectView/EditorView) to
  @threadwick/editor/browser. **apps/studio/src/core is now gone** — the entire chart core + runtime
  + I/O lives in packages/editor; this completes the editor extraction (TW-010/011/012). Verified:
  editor typecheck + 30 tests; studio typecheck + 3 tests + eslint; 9/9 packages build+typecheck.

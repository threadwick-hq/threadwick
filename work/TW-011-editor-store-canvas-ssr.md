---
id: TW-011
title: Move the store and imperative canvas controller into packages/editor behind an SSR-safe entry
type: refactor
area:
  - packages/editor
  - apps/studio
phase: 6
status: active
priority: p1
created: 2026-06-23
assignee: agent
started: 2026-06-23
acceptance:
  - store + canvas live in @threadwick/editor behind a browser-only subpath; the data subpath imports cleanly server-side
  - no document/window/localStorage executes on import of the data subpath
  - apps/studio behaviour unchanged; window.threadwick still inspectable
---

## Context

The store (localStorage) and editorCanvas controller (DOM) are framework-agnostic but browser-coupled. They must not reach SSR. Spec §1. (Phase 6 sub-phase 6a.) From the Studio redesign handoff at `apps/studio/docs/redesign/`.

## Scope

In: Move store.ts (persist, version lifecycle, undo/redo, isDraftActive guard) and editorCanvas.ts (initCanvas) plus the CanvasView React shim. Split exports: a pure/data subpath importable in SSR and a browser-only subpath for canvas/store init. Preserve window.threadwick.

Out: files.ts move (TW-012). The /studio mount that consumes the browser entry (TW-019).

Depends on: TW-010.

## Acceptance

- [x] store + canvas live in @threadwick/editor behind a browser-only subpath (`./browser`); the data subpath (`.`) imports cleanly server-side
- [x] no document/window/localStorage executes on import of the data subpath (proven: importing `.` in bare node yields 73 core exports, no store/initCanvas, no error)
- [x] apps/studio behaviour unchanged; window.threadwick still inspectable (typecheck + tests + eslint clean)

## Log

- 2026-06-23 created (Phase 6 re-scope from the studio redesign handoff).
- 2026-06-23 implemented. git-moved store.ts (604 LOC) + editorCanvas.ts (533 LOC) into
  packages/editor/src, re-pointing their core imports to the relative `./index` barrel. Added a
  `./browser` subpath (src/browser.ts) exporting the store + canvas runtime; the `.` barrel stays
  the pure SSR-safe core (no DOM/localStorage, React-free, headless). Kept the React CanvasView shim
  in apps/studio (headless-package boundary) and re-pointed its store/canvas imports +
  main.tsx/useStore/EditorView to @threadwick/editor/browser. Moved the store/version-lifecycle test
  cases into packages/editor/test/store.test.ts. Verified: editor typecheck + 30 tests (21 core + 9
  store, node env); studio typecheck + 3 tests + eslint clean; 9/9 packages build+typecheck; bare-node
  import of `.` proves the split. files.ts (the last studio core file) moves in TW-012.

---
id: TW-011
title: Move the store and imperative canvas controller into packages/editor behind an SSR-safe entry
type: refactor
area:
  - packages/editor
  - apps/studio
phase: 6
status: backlog
priority: p1
created: 2026-06-23
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

- [ ] store + canvas live in @threadwick/editor behind a browser-only subpath; the data subpath imports cleanly server-side
- [ ] no document/window/localStorage executes on import of the data subpath
- [ ] apps/studio behaviour unchanged; window.threadwick still inspectable

## Log

- 2026-06-23 created (Phase 6 re-scope from the studio redesign handoff).

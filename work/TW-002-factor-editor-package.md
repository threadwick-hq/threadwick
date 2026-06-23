---
id: TW-002
title: Factor the editor/viewer out of apps/studio into packages/editor
type: refactor
area:
  - apps/studio
  - packages/editor
phase: 6
status: abandoned
priority: p1
created: 2026-06-22
acceptance:
  - packages/editor exists as a framework-agnostic package (singleton store, imperative canvas, UI state)
  - the editor canvas is unchanged and remains AntD-free
  - apps/studio consumes @threadwick/editor with no behaviour change
---

## Context

Phase 6, step 1. The editor/viewer is extracted from apps/studio into a standalone
`packages/editor` so it can be mounted client-only in apps/web. See MIGRATION.md Phase 6.

## Scope

In: move the singleton store, imperative canvas, and UI state into packages/editor; wire studio to it.
Out: the AntD -> shadcn chrome migration (TW-003) and the apps/web mount (TW-004).

## Acceptance

- [ ] packages/editor exists, framework-agnostic
- [ ] editor canvas unchanged, AntD-free
- [ ] apps/studio consumes @threadwick/editor with no behaviour change

## Log

- 2026-06-22 created.
- 2026-06-23 abandoned: superseded by TW-010, TW-011, TW-012 (Phase 6 re-scope: split into three right-sized PRs).

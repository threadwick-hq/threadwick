---
id: TW-045
title: Build the craft-scoped Library store, sidebar counts and the three Library screens
type: feat
area:
  - apps/web
  - packages/core
  - packages/icons
phase: 6
status: backlog
priority: p2
created: 2026-06-23
acceptance:
  - the three Library screens render, craft-scoped, with sidebar counts
  - the Yarns stash supports friendly-middle tracking and find-patterns bridges
  - the Tools matrix toggles owned cells and feeds the project tool picker
  - the Library persists in its own key and round-trips losslessly (export -> import -> deep-equal), included in export-everything
---

## Context

Library has three sub-screens: Patterns (saved/bought grid + newer-version nudge), Yarns (stash swatch grid, friendly-middle tracking, generative bridges), Tools (tap-to-own size matrix). Spec §7. (Phase 6 sub-phase 6e.) From the Studio redesign handoff at `apps/studio/docs/redesign/`.

## Scope

In: Build the craft-scoped Library store + sidebar counts and the three screens: Patterns grid with the newer-version nudge, the Yarns stash grid + detail with marketplace bridges, the Tools tap-to-own size matrix powering the project tool picker. The Library persists in its OWN key (separate from the chart-project store, like the craft scope), so it needs no chart-project FILE_VERSION bump; it must be included in the export-everything path and round-trip losslessly.

Out: Live Ravelry data; the marketplace bridges deep-link into TW-047.

Depends on: TW-044, TW-023.

## Acceptance

- [ ] the three Library screens render, craft-scoped, with sidebar counts
- [ ] the Yarns stash supports friendly-middle tracking and find-patterns bridges
- [ ] the Tools matrix toggles owned cells and feeds the project tool picker
- [ ] the Library persists in its own key and round-trips losslessly (export -> import -> deep-equal), included in export-everything

## Log

- 2026-06-23 created (Phase 6 re-scope from the studio redesign handoff).

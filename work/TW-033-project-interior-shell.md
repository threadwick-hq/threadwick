---
id: TW-033
title: Build the Project interior shell, rail and pinned status tile
type: feat
area:
  - apps/web
  - packages/core
phase: 6
status: backlog
priority: p2
created: 2026-06-23
acceptance:
  - the project interior takes over with identity tile + breadcrumb (no layout shift)
  - the rail lists Overview, Patterns, Materials & notes, + Add section
  - the pinned status tile shows the state selector + aggregated progress + Continue making
---

## Context

A project is a make. Drill-in takeover mirroring the pattern interior: identity tile + state pill + cog, breadcrumb, Overview first, pinned status tile (state selector + aggregated progress + Continue making). Spec §5. (Phase 6 sub-phase 6e.) From the Studio redesign handoff at `apps/studio/docs/redesign/`.

## Scope

In: Build the Project interior shell + rail: Overview, Patterns (each opens the Follow view, per-pattern progress), Materials & notes (Yarns/Tools/Notes/Photos), + Add section, and the pinned status tile.

Out: Overview body (TW-034), the picker (folds into TW-034/045).

Depends on: TW-026, TW-025.

## Acceptance

- [ ] the project interior takes over with identity tile + breadcrumb (no layout shift)
- [ ] the rail lists Overview, Patterns, Materials & notes, + Add section
- [ ] the pinned status tile shows the state selector + aggregated progress + Continue making

## Log

- 2026-06-23 created (Phase 6 re-scope from the studio redesign handoff).

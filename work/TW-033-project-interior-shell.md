---
id: TW-033
title: Build the Project interior shell, rail and pinned status tile
type: feat
area:
  - apps/web
  - packages/core
phase: 6
status: review
priority: p2
created: 2026-06-23
acceptance:
  - the project interior takes over with identity tile + breadcrumb (no layout shift)
  - the rail lists Overview, Patterns, Materials & notes, + Add section
  - the pinned status tile shows the state selector + aggregated progress + Continue making
assignee: agent
started: 2026-06-27
pr: 26
---
## Context

A project is a make. Drill-in takeover mirroring the pattern interior: identity tile + state pill + cog, breadcrumb, Overview first, pinned status tile (state selector + aggregated progress + Continue making). Spec §5. (Phase 6 sub-phase 6e.) From the Studio redesign handoff at `apps/studio/docs/redesign/`.

## Scope

In: Build the Project interior shell + rail: Overview, Patterns (each opens the Follow view, per-pattern progress), Materials & notes (Yarns/Tools/Notes/Photos), + Add section, and the pinned status tile.

Out: Overview body (TW-034), the picker (folds into TW-034/045).

Depends on: TW-026, TW-025.

## Acceptance

- [x] the project interior takes over with identity tile + breadcrumb (no layout shift)
- [x] the rail lists Overview, Patterns, Materials & notes, + Add section
- [x] the pinned status tile shows the state selector + aggregated progress + Continue making

## Log

- 2026-06-28 Implemented project interior drill-in on `/studio/projects/:projectId`: TW-025 slot contract (`InteriorSlot`, `InteriorChromeProvider`), identity tile + breadcrumb, rail (Overview, per-pattern Follow links, Materials & notes, + Add section placeholder), pinned status tile (maker status selector, aggregated progress, Continue making). Overview/materials bodies remain placeholders for TW-034. Stacked on TW-032 for Follow route + progress aggregation.
- 2026-06-27 claimed by agent.
- 2026-06-23 created (Phase 6 re-scope from the studio redesign handoff).

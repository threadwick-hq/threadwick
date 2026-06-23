---
id: TW-028
title: Build the Follow progress state machine, Undo and aggregation (FILE_VERSION 3 to 4)
type: feat
area:
  - packages/editor
  - packages/types
phase: 6
status: backlog
priority: p1
created: 2026-06-23
acceptance:
  - progress advances/undoes over Units and aggregates per-pattern to project
  - FILE_VERSION is 4 with a migration covering both storage keys
  - the export -> import -> deep-equal round-trip stays green
---

## Context

The one-big-action cursor over Units, with one-step Undo and per-pattern to project aggregation. This is the first stored-shape change of the phase. Spec §5, §6. (Phase 6 sub-phase 6d.) From the Studio redesign handoff at `apps/studio/docs/redesign/`.

## Scope

In: Build the progress state machine (advance/complete Unit, Undo one step, aggregate per-pattern into project progress). Bump FILE_VERSION 3 -> 4 with a normalizeProject migration covering threadwickstudio:v2 AND legacy stitchgridstudio:v2; keep the export -> import -> deep-equal round-trip green in the same PR.

Out: The Follow UI surfaces (TW-029..031).

Depends on: TW-027.

## Acceptance

- [ ] progress advances/undoes over Units and aggregates per-pattern to project
- [ ] FILE_VERSION is 4 with a migration covering both storage keys
- [ ] the export -> import -> deep-equal round-trip stays green

## Log

- 2026-06-23 created (Phase 6 re-scope from the studio redesign handoff).

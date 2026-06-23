---
id: TW-036
title: Build the Pattern interior shell, rail and Overview (edit mode) in shadcn
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
  - the edit-mode rail renders details tile + Overview + Components/artifacts + Materials + version tile
  - the Overview shows description, photos, key-facts tiles, and a navigable what-is-inside
  - no layout shift entering the interior
---

## Context

Opening a Workbench pattern is a role-aware drill-in (edit hub). Rail: details tile + Private/Public pill + cog, Overview, Components -> artifacts, Materials, pinned version tile. Spec §4.1, §4.2. (Phase 6 sub-phase 6e.) From the Studio redesign handoff at `apps/studio/docs/redesign/`.

## Scope

In: Build the edit-mode Pattern interior shell + rail + Overview screen (editable description, photos, key-facts tiles, what is inside) on shadcn.

Out: Version tile + quality checks (TW-037). View mode (TW-038).

Depends on: TW-035, TW-025.

## Acceptance

- [ ] the edit-mode rail renders details tile + Overview + Components/artifacts + Materials + version tile
- [ ] the Overview shows description, photos, key-facts tiles, and a navigable what-is-inside
- [ ] no layout shift entering the interior

## Log

- 2026-06-23 created (Phase 6 re-scope from the studio redesign handoff).

---
id: TW-020
title: Build the StudioShell layout route with the UWD cap-and-centre rule
type: feat
area:
  - apps/web
  - packages/core
phase: 6
status: backlog
priority: p1
created: 2026-06-23
acceptance:
  - StudioShell renders the sidebar + main frame
  - content caps and centers on ultra-wide; chrome stays fixed-width
  - the layout hosts a placeholder outlet for each destination
---

## Context

The frame every studio screen mounts into. Fixed-width chrome + content capped and centered; excess is calm margin. Spec §1, §0 (UWD rule). (Phase 6 sub-phase 6b.) From the Studio redesign handoff at `apps/studio/docs/redesign/`.

## Scope

In: Build the StudioShell layout route: the sidebar + main grid, the content-cap-and-centre rule app-wide, and the outlet that interiors take over.

Out: Sidebar contents (TW-021), topbar (TW-022), interiors.

Depends on: TW-019.

## Acceptance

- [ ] StudioShell renders the sidebar + main frame
- [ ] content caps and centers on ultra-wide; chrome stays fixed-width
- [ ] the layout hosts a placeholder outlet for each destination

## Log

- 2026-06-23 created (Phase 6 re-scope from the studio redesign handoff).

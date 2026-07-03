---
id: TW-031
title: Wire the locked-responsive Follow shell across all five breakpoints plus Wake Lock
type: feat
area:
  - apps/web
  - packages/core
phase: 6
status: done
priority: p1
created: 2026-06-23
pr: 36
acceptance:
  - the Follow layout matches the locked design at all five breakpoints
  - desktop is immersive (nav recedes) and the stage caps + centers on ultra-wide
  - keep-awake holds a Wake Lock while following
assignee: agent
started: 2026-06-27
completed: 2026-06-28
---
## Context

Follow is locked across phone, tablet portrait, tablet landscape, desktop, and ultra-wide, with the cap-and-centre rule and an immersive desktop. Spec §6 (responsive). (Phase 6 sub-phase 6d.) From the Studio redesign handoff at `apps/studio/docs/redesign/`.

## Scope

In: Compose the instruction box + chart pane across the five breakpoints (stacked on phone/tablet-portrait; side-by-side on tablet-landscape/desktop; immersive desktop with a slim back-to-project bar; stage caps ~1040px and centers on ultra-wide). Wire keep-awake (Wake Lock).

Out: External-pattern fallback (TW-032).

Depends on: TW-029, TW-030, TW-033 (the project interior Follow is launched from; not the sidebar slot contract — Follow recedes the global nav to its own back-to-project bar).

## Acceptance

- [x] the Follow layout matches the locked design at all five breakpoints
- [x] desktop is immersive (nav recedes) and the stage caps + centers on ultra-wide
- [x] keep-awake holds a Wake Lock while following

## Log

- 2026-06-28 published PR #24 (stacked on TW-030); Graphite Agent review pending.
- 2026-06-28 implemented `FollowShell`, `FollowHeader`, `useWakeLock`, immersive `StudioShell`; responsive stacked/split layout with 1040px stage cap.
- 2026-06-27 claimed by agent.
- 2026-06-23 created (Phase 6 re-scope from the studio redesign handoff).

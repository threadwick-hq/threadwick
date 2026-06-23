---
id: TW-017
title: Drop AntD from apps/studio and remove the theme and provider wiring
type: chore
area:
  - apps/studio
phase: 6
status: backlog
priority: p2
created: 2026-06-23
acceptance:
  - antd is gone from apps/studio dependencies and source
  - the app builds and behaves identically without the AntD provider
  - no AntD imports remain
---

## Context

Once every surface is on shadcn, AntD and its ConfigProvider/theme can be deleted. Spec §0. (Phase 6 sub-phase 6c.) From the Studio redesign handoff at `apps/studio/docs/redesign/`.

## Scope

In: Remove antd + the theme.ts/ConfigProvider wiring + the antd dependency; verify no AntD imports remain.

Out: No behaviour change.

Depends on: TW-014, TW-015, TW-016.

## Acceptance

- [ ] antd is gone from apps/studio dependencies and source
- [ ] the app builds and behaves identically without the AntD provider
- [ ] no AntD imports remain

## Log

- 2026-06-23 created (Phase 6 re-scope from the studio redesign handoff).

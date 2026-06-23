---
id: TW-037
title: Build the pinned version tile, publishing controls and reward-never-penalize quality checks
type: feat
area:
  - apps/web
  - packages/core
phase: 6
status: backlog
priority: p2
created: 2026-06-23
acceptance:
  - the version tile switches versions and shows the right contextual publish action + Remix
  - quality checks reward (missing items are muted, never red)
  - the minimum floor gently gates publishing
---

## Context

The pinned version tile = switcher + a contextual action (Publish pattern / Publish version / New draft) + Remix. Quality checks reward, never penalize; a minimum floor gently gates publishing. Spec §4.1, §4.5. (Phase 6 sub-phase 6e.) From the Studio redesign handoff at `apps/studio/docs/redesign/`.

## Scope

In: Build the version tile + publishing controls over the TW-035 contract, and the quality checks (edit audit: present=checked, missing=muted add-to-strengthen; a minimum floor that gently gates publish).

Out: View-mode what-is-included (TW-038).

Depends on: TW-036.

## Acceptance

- [ ] the version tile switches versions and shows the right contextual publish action + Remix
- [ ] quality checks reward (missing items are muted, never red)
- [ ] the minimum floor gently gates publishing

## Log

- 2026-06-23 created (Phase 6 re-scope from the studio redesign handoff).

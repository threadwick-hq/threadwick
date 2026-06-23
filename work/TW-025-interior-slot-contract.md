---
id: TW-025
title: Define the identity-tile slot-swap and breadcrumb contract for interiors (no layout shift)
type: feat
area:
  - apps/web
  - packages/core
phase: 6
status: backlog
priority: p2
created: 2026-06-23
acceptance:
  - entering an interior swaps the craft picker for the identity tile with no layout shift
  - a breadcrumb reflects the entry path
  - the contract is consumed by both pattern and project interiors
---

## Context

In a pattern/project drill-in the craft-picker slot is replaced by the object identity tile with no layout shift, and a breadcrumb appears. Spec §2, §4.1, §5. (Phase 6 sub-phase 6b.) From the Studio redesign handoff at `apps/studio/docs/redesign/`.

## Scope

In: Define the slot-swap contract: the interior identity tile occupies the craft-picker slot 1:1, plus the breadcrumb pattern; the shell exposes the slot, interiors fill it.

Out: The interior bodies (TW-033/036).

Depends on: TW-022, TW-023.

## Acceptance

- [ ] entering an interior swaps the craft picker for the identity tile with no layout shift
- [ ] a breadcrumb reflects the entry path
- [ ] the contract is consumed by both pattern and project interiors

## Log

- 2026-06-23 created (Phase 6 re-scope from the studio redesign handoff).

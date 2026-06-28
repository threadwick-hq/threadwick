---
id: TW-027
title: Build the instruction-decomposition engine (round to follow Units per granularity)
type: feat
area:
  - packages/editor
  - packages/types
phase: 6
status: done
priority: p1
created: 2026-06-23
completed: 2026-06-28
acceptance:
  - the engine decomposes a round into per-row / pattern / granular Units from explicit marks
  - an unmarked round falls back to per-row cleanly
  - the engine is pure (no DOM) and unit-tested on representative charts
assignee: agent
started: 2026-06-27
pr: 20
---
## Context

The hardest, most novel logic: turn a round into bite-size Units at per-row / pattern / granular granularity for the one-big-action model. Decided: patterns mark repeats/corners EXPLICITLY (an authoring affordance), so decomposition is reliable. Spec §6 (one-action model). (Phase 6 sub-phase 6d.) From the Studio redesign handoff at `apps/studio/docs/redesign/`.

## Scope

In: Add explicit repeat/corner marks to the Pattern types + a small authoring affordance; build the pure engine that decomposes a round into Units at each granularity from those marks, with a graceful per-row fallback when marks are absent.

Out: The progress state machine (TW-028). The Follow UI (TW-029/030).

Depends on: TW-026, TW-010.

## Acceptance

- [x] the engine decomposes a round into per-row / pattern / granular Units from explicit marks
- [x] an unmarked round falls back to per-row cleanly
- [x] the engine is pure (no DOM) and unit-tested on representative charts

## Log

- 2026-06-28 implemented pure decomposition engine in `@threadwick/editor` (`decomposition.ts`): `RoundFollowMarks` on `Round`, corner/repeat authoring in store + inspector, sample granny square pre-marked, 7 unit tests.
- 2026-06-27 claimed by agent.
- 2026-06-23 created (Phase 6 re-scope from the studio redesign handoff).

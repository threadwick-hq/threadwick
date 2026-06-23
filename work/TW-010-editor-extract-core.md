---
id: TW-010
title: Scaffold packages/editor and move the DOM-free chart core with its tests
type: refactor
area:
  - packages/editor
  - apps/studio
phase: 6
status: backlog
priority: p1
created: 2026-06-23
acceptance:
  - @threadwick/editor exists, framework-agnostic, with a deliberate public barrel
  - the moved core.test.ts (round-trip + version-lifecycle + migration) stays green
  - apps/studio consumes @threadwick/editor with zero behaviour change
---

## Context

Foundational extraction. The chart core in apps/studio/src/core is React-free with a sharp DOM boundary, so it moves nearly verbatim. Spec §4-§5, §10. (Phase 6 sub-phase 6a.) From the Studio redesign handoff at `apps/studio/docs/redesign/`.

## Scope

In: Create @threadwick/editor (ESM, tsup, @threadwick/config tsconfig, exports map). Move model/types/symbols/render/connectivity/geometry/util/colors/sample + test/core.test.ts verbatim behind an intentional public barrel that also exports the read-side primitives the Follow view needs (chainOrder, summarizeRound, spacesForRound, chartToSVG/stitchToSVG). Re-point apps/studio imports.

Out: No model change (ships FILE_VERSION 3 intact). No store/canvas/files move (TW-011/012). No chrome change.

Depends on: nothing (can start now).

## Acceptance

- [ ] @threadwick/editor exists, framework-agnostic, with a deliberate public barrel
- [ ] the moved core.test.ts (round-trip + version-lifecycle + migration) stays green
- [ ] apps/studio consumes @threadwick/editor with zero behaviour change

## Log

- 2026-06-23 created (Phase 6 re-scope from the studio redesign handoff).

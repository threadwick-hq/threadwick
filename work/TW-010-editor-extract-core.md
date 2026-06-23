---
id: TW-010
title: Scaffold packages/editor and move the DOM-free chart core with its tests
type: refactor
area:
  - packages/editor
  - apps/studio
phase: 6
status: done
priority: p1
created: 2026-06-23
assignee: agent
started: 2026-06-23
completed: 2026-06-23
pr: 6
acceptance:
  - @threadwick/editor exists, framework-agnostic, with a deliberate public barrel
  - the moved core.test.ts (round-trip + version-lifecycle + migration) stays green
  - apps/studio consumes @threadwick/editor with zero behaviour change
---

## Context

Foundational extraction. The chart core in apps/studio/src/core is React-free with a sharp DOM boundary, so it moves nearly verbatim. Spec §4-§5, §10. (Phase 6 sub-phase 6a.) From the Studio redesign handoff at `apps/studio/docs/redesign/`.

## Scope

In: Create @threadwick/editor (ESM, tsup, @threadwick/config tsconfig, exports map). Move model/types/symbols/render/connectivity/geometry/util/colors/sample + test/core.test.ts verbatim behind an intentional public barrel that also exports the read-side primitives the Follow view needs (chainOrder, summarizeRound, spacesForRound, chartToSVG/stitchToSVG); summarizeRound is pure (no DOM) so it is lifted out of files.ts into the core here. Re-point apps/studio imports.

Out: No model change (ships FILE_VERSION 3 intact). No store/canvas move (TW-011); files.ts DOM helpers move in TW-012 (only its pure summarizeRound is lifted here). No chrome change.

Depends on: nothing (can start now).

## Acceptance

- [x] @threadwick/editor exists, framework-agnostic, with a deliberate public barrel
- [x] the moved core tests (round-trip + migration + connectivity + render + summarizeRound) stay green; the store/version-lifecycle cases stay in apps/studio until the store moves in TW-011
- [x] apps/studio consumes @threadwick/editor with zero behaviour change (typecheck + tests + eslint clean)

## Log

- 2026-06-23 created (Phase 6 re-scope from the studio redesign handoff).
- 2026-06-23 implemented. Scaffolded @threadwick/editor (source-export, matching @threadwick/icons
  + @threadwick/i18n; tsup deferred since every consumer is a bundler/vitest). git-moved the nine
  DOM-free modules (model/types/symbols/render/connectivity/geometry/util/colors/sample, ~964 LOC,
  zero external deps) behind a public barrel (src/index.ts). Lifted the pure summarizeRound out of
  the studio's files.ts into src/instructions.ts. Split the test: the DOM-free cases moved to
  packages/editor/test (21 pass); the store/version-lifecycle cases stay in apps/studio (move with
  the store in TW-011). Re-pointed every studio import of a moved module to @threadwick/editor.
  Verified: editor typecheck + 21 tests; studio typecheck + 12 tests + eslint clean; 9/9 packages
  build+typecheck. Ships FILE_VERSION 3 intact (no migration).

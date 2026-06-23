---
id: TW-018
title: Bring the moved packages/editor code to Biome-clean
type: chore
area:
  - packages/editor
  - packages/config
  - repo
phase: 6
status: active
priority: p2
created: 2026-06-23
assignee: agent
started: 2026-06-23
acceptance:
  - packages/editor passes `biome check` with no errors
  - packages/editor is added to the Biome-clean set, unblocking TW-007's gate flip
  - `pnpm check` stays green
---

## Context

apps/studio is excluded from Biome (!apps/studio/**); moved code lands in packages/editor under the gate but is not Biome-clean (~74 errors). Coordinates with TW-007, which owns flipping the CI gate (dropping `|| true`) once every package is clean. (Phase 6 sub-phase 6a.) From the Studio redesign handoff at `apps/studio/docs/redesign/`.

## Scope

In: Format + fix the moved packages/editor code to pass Biome, adding it to the clean set. Flipping the CI biome step to a hard gate (dropping `|| true`) is TW-007's job and needs every package clean.

Out: apps/studio Biome scope (still excluded until its own surfaces land in apps/web).

Depends on: TW-011, TW-012.

## Acceptance

- [x] packages/editor passes `biome check` with no errors (exit 0; 162 warnings remain, all warn-level)
- [x] packages/editor is added to the Biome-clean set, unblocking TW-007's gate flip (editor now contributes 0 errors; TW-007 still waits on core/config/org/types)
- [x] `pnpm check` stays green (editor lint/typecheck/test pass; CI build+typecheck 9/9)

## Log

- 2026-06-23 created (Phase 6 re-scope from the studio redesign handoff).
- 2026-06-23 implemented. Took packages/editor from 52 Biome errors to 0: safe autofix (formatting +
  safe lint), then the 26 non-auto errors — renamed the `R` radius property to `radius` in sample.ts
  (12 useNamingConvention), renamed editorCanvas.ts -> editor-canvas.ts + updated the browser barrel
  (1 useFilenamingConvention), de-mutated the `a %= 360` parameter in geometry.ts (1 noParameterAssign),
  and translated the migration block's `eslint-disable no-explicit-any` into a Biome
  `biome-ignore-start/end` range over the normalize* functions (12 noExplicitAny — the deliberate
  untrusted-JSON parse boundary, NOT rewritten). Left 162 warn-level diagnostics (139 noNonNullAssertion
  — the moved core's `!` idiom; 11 cognitive-complexity on the editor controller; 12 optional-chain),
  per "don't over-rotate on style." Verified: biome check exit 0, editor typecheck + 30 tests, studio
  typecheck + 3 tests + eslint, 9/9 packages. TW-007 still waits on the other legacy packages.

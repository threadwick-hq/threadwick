---
id: TW-018
title: Bring the moved packages/editor code to Biome-clean
type: chore
area:
  - packages/editor
  - packages/config
  - repo
phase: 6
status: backlog
priority: p2
created: 2026-06-23
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

- [ ] packages/editor passes `biome check` with no errors
- [ ] packages/editor is added to the Biome-clean set, unblocking TW-007's gate flip
- [ ] `pnpm check` stays green

## Log

- 2026-06-23 created (Phase 6 re-scope from the studio redesign handoff).

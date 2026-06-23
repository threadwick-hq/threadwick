---
id: TW-018
title: Bring packages/editor to Biome-clean and remove the report-only escape hatch
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
  - the CI biome step for packages is a hard gate (no `|| true`)
  - `pnpm check` stays green
---

## Context

apps/studio is excluded from Biome (!apps/studio/**); moved code lands in packages/editor under the gate but is not Biome-clean (~74 errors). Folds in TW-007. (Phase 6 sub-phase 6a.) From the Studio redesign handoff at `apps/studio/docs/redesign/`.

## Scope

In: Format + fix the moved packages/editor code to pass Biome; once green, drop the `|| true` from the CI biome step for packages (coordinated with TW-007).

Out: apps/studio Biome scope (still excluded until its own surfaces land in apps/web).

Depends on: TW-011, TW-012.

## Acceptance

- [ ] packages/editor passes `biome check` with no errors
- [ ] the CI biome step for packages is a hard gate (no `|| true`)
- [ ] `pnpm check` stays green

## Log

- 2026-06-23 created (Phase 6 re-scope from the studio redesign handoff).

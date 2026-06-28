---
id: TW-007
title: Promote Biome from report-only to a hard CI gate
type: chore
area:
  - repo
  - packages/config
phase: 3
status: done
priority: p2
created: 2026-06-22
completed: 2026-06-28
acceptance:
  - pnpm biome check packages passes with no errors
  - the `|| true` is removed from the Biome CI step
  - a lint error in packages/* makes CI red
assignee: agent
started: 2026-06-28
pr: 40
---
## Context

The Biome CI step is report-only (`pnpm biome check packages || true`) for the staged style
migration (MIGRATION.md Phase 3). As of now `biome check packages` reports ~72 errors (mostly
tab/space drift), so it cannot be hardened until those are fixed. The work/ derivation gate relies
on CI having teeth, so this is the prerequisite for the tracking system's integrity guarantees.

## Scope

In: run the format pass + safe autofixes across packages, then remove `|| true`.
Out: widening build/typecheck beyond packages/* (TW-008).

## Acceptance

- [x] biome check packages is clean
- [x] CI Biome step is a hard gate (no `|| true`)
- [x] a packages/* lint error fails CI

## Log

- 2026-06-28 claimed by agent.
- 2026-06-28 implemented. Ran format pass + safe/unsafe autofixes across packages (~118 errors → 0); fixed remaining 26 lint errors (a11y, naming conventions, Tailwind v4 theme.css excluded, script types). Removed `|| true` from CI Biome step. 122 warn-level diagnostics remain (noNonNullAssertion, cognitive complexity).
- 2026-06-22 created. Deferred from this change to avoid a red CI mid-migration.

---
id: TW-008
title: Widen CI build/typecheck beyond packages/* to apps and root
type: chore
area:
  - repo
phase: 8
status: active
priority: p3
created: 2026-06-22
acceptance:
  - CI build + typecheck cover apps/* and root, not only packages/*
  - the suite is green once the migration apps stabilize
assignee: agent
started: 2026-06-28
---
## Context

CI currently runs `turbo build typecheck --filter=./packages/*` only. Apps are mid-migration and not
reliably green, so widening now would break CI. Do this once the migration settles (Phase 8), so a
break in apps/web or apps/studio is caught.

## Scope

In: extend the CI filter to apps/* and root once apps build cleanly.
Out: the Biome hardening (TW-007).

## Acceptance

- [x] CI build + typecheck cover apps/* and root
- [x] suite green after the migration apps stabilize

## Log

- 2026-06-28 Widened CI filter to `./packages/*` + `./apps/*`; fixed unused `resolvePattern` param in `refUnitsDone` so studio typecheck passes.
- 2026-06-28 claimed by agent.
- 2026-06-22 created. Deferred until the migration apps are stable.

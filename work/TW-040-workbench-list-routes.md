---
id: TW-040
title: Add client-only Workbench list routes and shared PhotoCard/CardGrid/EmptyState primitives
type: feat
area:
  - apps/web
  - packages/core
phase: 6
status: backlog
priority: p2
created: 2026-06-23
acceptance:
  - shared PhotoCard/CardGrid/EmptyState live in @threadwick/core and follow the tile/placeholder rule
  - the Workbench route group mounts client-only under /studio
  - cards use photos, never chart snapshots
---

## Context

Workbench lists (and most screens) need a photo-card grid. Patterns/projects are represented by photos, never chart snapshots. Spec §0, §1. (Phase 6 sub-phase 6e.) From the Studio redesign handoff at `apps/studio/docs/redesign/`.

## Scope

In: Add the client-only Workbench route group + shared PhotoCard / CardGrid / EmptyState primitives in @threadwick/core (white tile + hairline border; gray reserved for image placeholders).

Out: The list bodies (TW-041).

Depends on: TW-021, TW-026.

## Acceptance

- [ ] shared PhotoCard/CardGrid/EmptyState live in @threadwick/core and follow the tile/placeholder rule
- [ ] the Workbench route group mounts client-only under /studio
- [ ] cards use photos, never chart snapshots

## Log

- 2026-06-23 created (Phase 6 re-scope from the studio redesign handoff).

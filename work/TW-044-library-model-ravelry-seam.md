---
id: TW-044
title: Define the top-level Library model (StashYarn/OwnedTool/SavedPattern) and a decouplable Ravelry seam
type: feat
area:
  - packages/types
  - packages/org
phase: 6
status: backlog
priority: p2
created: 2026-06-23
acceptance:
  - @threadwick/types encodes StashYarn/OwnedTool/SavedPattern
  - a Ravelry seam exists behind a capability flag with a fixture seed
  - any stored-shape change bumps FILE_VERSION + migrates both keys + keeps the round-trip green
---

## Context

Library is your collection: saved/bought patterns, a yarn stash, an owned-tools matrix, drawing on Ravelry metadata. Spec §7. (Phase 6 sub-phase 6e.) From the Studio redesign handoff at `apps/studio/docs/redesign/`.

## Scope

In: Define StashYarn / OwnedTool / SavedPattern in @threadwick/types and a decouplable Ravelry metadata access seam (a fixture seed for Phase 6; a live source later). Coordinate the FILE_VERSION migration with the Phase-7 model owner (one model, not two).

Out: The Library screens (TW-045). A live Ravelry source.

Depends on: TW-026.

## Acceptance

- [ ] @threadwick/types encodes StashYarn/OwnedTool/SavedPattern
- [ ] a Ravelry seam exists behind a capability flag with a fixture seed
- [ ] any stored-shape change bumps FILE_VERSION + migrates both keys + keeps the round-trip green

## Log

- 2026-06-23 created (Phase 6 re-scope from the studio redesign handoff).

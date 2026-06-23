---
id: TW-039
title: Add a recents and plain-language-state read model over patterns and projects
type: feat
area:
  - apps/web
  - packages/core
phase: 6
status: backlog
priority: p2
created: 2026-06-23
acceptance:
  - the read model returns the lead recent + a recents shelf across patterns and projects
  - each recent carries a plain-language state derived from its kind + timestamp
  - it is pure and unit-tested
---

## Context

Home Continue + recents need a read model that enumerates the most-recent thing with the right verb and a plain-language state ("Edited 9 hours ago", "Worked on 2 days ago"). Spec §3. (Phase 6 sub-phase 6e.) From the Studio redesign handoff at `apps/studio/docs/redesign/`.

## Scope

In: Build a read model over the two top-level collections that yields the single most-recent active thing + a recents shelf, each with a plain-language timestamp/state.

Out: The Home UI (TW-042).

Depends on: TW-026.

## Acceptance

- [ ] the read model returns the lead recent + a recents shelf across patterns and projects
- [ ] each recent carries a plain-language state derived from its kind + timestamp
- [ ] it is pure and unit-tested

## Log

- 2026-06-23 created (Phase 6 re-scope from the studio redesign handoff).

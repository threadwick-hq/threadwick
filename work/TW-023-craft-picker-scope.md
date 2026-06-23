---
id: TW-023
title: Implement the craft picker as a studio-wide persisted scope with inclusion semantics
type: feat
area:
  - apps/web
  - packages/core
  - packages/types
phase: 6
status: backlog
priority: p2
created: 2026-06-23
acceptance:
  - the craft scope persists across reloads in its own key (no project-store FILE_VERSION change)
  - scoping a craft filters by inclusion (multi-craft items still appear; search still reaches everything)
  - the picker lists only your crafts + add-craft
---

## Context

A picker at the top of the sidebar scoping the whole studio to a craft; a mode, not just a filter. Inclusion semantics (never hides reachable things). Spec §2. (Phase 6 sub-phase 6b.) From the Studio redesign handoff at `apps/studio/docs/redesign/`.

## Scope

In: Build the craft picker (default "All my crafts", lists only crafts you work with + add-craft). Persist the active craft in a SEPARATE key (not the project store, to avoid a FILE_VERSION bump). Scope Library/Marketplace/Home; default craft-specific terminology/tools. Inclusion semantics.

Out: Per-surface filtering details land with each screen.

Depends on: TW-021.

## Acceptance

- [ ] the craft scope persists across reloads in its own key (no project-store FILE_VERSION change)
- [ ] scoping a craft filters by inclusion (multi-craft items still appear; search still reaches everything)
- [ ] the picker lists only your crafts + add-craft

## Log

- 2026-06-23 created (Phase 6 re-scope from the studio redesign handoff).

---
id: TW-021
title: Build the always-expanded sidebar nav with sections, counts and active state
type: feat
area:
  - apps/web
  - packages/core
  - packages/icons
phase: 6
status: done
priority: p1
created: 2026-06-23
assignee: agent
started: 2026-06-23
completed: 2026-06-23
pr: 15
acceptance:
  - the sidebar shows all sections + items, always expanded
  - counts render on Workbench/Library/Following/Wishlist
  - the active destination uses the reserved accent
---

## Context

A wide, always-expanded left sidebar; every section item always visible. Order encodes the day: create, stash, discover, business. Spec §1. (Phase 6 sub-phase 6b.) From the Studio redesign handoff at `apps/studio/docs/redesign/`.

## Scope

In: Build the sidebar: Home, Workbench (Patterns/Projects), Library (Patterns/Yarns/Tools), Marketplace (Home/Browse/Following/Free/Wishlist), pinned local-status footer. Counts on your own stuff + Following/Wishlist; active-item accent.

Out: Craft picker slot (TW-023), Creator Insights (deferred), mobile bar (TW-024).

Depends on: TW-020.

## Acceptance

- [x] the sidebar shows all sections + items, always expanded
- [x] counts render on Workbench/Library/Following/Wishlist
- [x] the active destination uses the reserved accent

## Log

- 2026-06-23 created (Phase 6 re-scope from the studio redesign handoff).
- 2026-06-23 claimed.
- 2026-06-23 Built the sidebar (Home + Workbench/Library/Marketplace sections, NavLink
  active accent, per-item counts, pinned local-status footer). Extracted a shared
  hydrate-once studio store (useStudioStore/ensureStudioStore) the sidebar + editor share,
  refactored editor-mount onto it (preserving the TW-019 re-mount fix via the memoised
  storePromise), switched the placeholder route to a splat. Added 6 nav glyphs to
  @threadwick/icons. Counts: Workbench from the store; Library/Following/Wishlist honest
  zeros until TW-044/046. Verified at 375/1280 + active state + editor still loads + SSR
  isolation (0 localStorage server-side). PR #15. Craft picker → TW-023; mobile bar → TW-024.
- 2026-06-23 Adversarial code-review workflow (4 lenses): 1 minor confirmed (1 refuted) —
  nav section labels weren't programmatically associated with their links, so duplicate
  link names were ambiguous; wrapped each section in role=group + aria-labelledby. Merged
  via PR #15.

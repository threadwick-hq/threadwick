---
id: TW-021
title: Build the always-expanded sidebar nav with sections, counts and active state
type: feat
area:
  - apps/web
  - packages/core
  - packages/icons
phase: 6
status: backlog
priority: p1
created: 2026-06-23
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

- [ ] the sidebar shows all sections + items, always expanded
- [ ] counts render on Workbench/Library/Following/Wishlist
- [ ] the active destination uses the reserved accent

## Log

- 2026-06-23 created (Phase 6 re-scope from the studio redesign handoff).

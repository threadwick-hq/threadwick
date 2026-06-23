---
id: TW-038
title: Build the Pattern view-mode decision surface and Start-making/Buy/Remix actions
type: feat
area:
  - apps/web
  - packages/core
phase: 6
status: backlog
priority: p2
created: 2026-06-23
acceptance:
  - view mode shows gallery, creator attribution, price + actions, and read-only previews
  - Start making creates a Project in the background (no orphaned sessions)
  - Buy and Remix are wired (buy-then-start for paid)
---

## Context

The same screen re-skinned to answer "do I want to make it?" (not the round tracker): gallery, creator, price + actions, read-only previews, reviews. Start making creates a Project in the background. Spec §4.4. (Phase 6 sub-phase 6e.) From the Studio redesign handoff at `apps/studio/docs/redesign/`.

## Scope

In: Build the view-mode surface: gallery + creator + price/actions row, read-only artifact previews, quality as what-is-included, reviews link; wire Start making (creates a Project) / Buy / Remix.

Out: The buy flow + ownership originate in marketplace/auth.

Depends on: TW-037, TW-033.

## Acceptance

- [ ] view mode shows gallery, creator attribution, price + actions, and read-only previews
- [ ] Start making creates a Project in the background (no orphaned sessions)
- [ ] Buy and Remix are wired (buy-then-start for paid)

## Log

- 2026-06-23 created (Phase 6 re-scope from the studio redesign handoff).

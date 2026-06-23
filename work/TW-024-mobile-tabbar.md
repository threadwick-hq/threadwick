---
id: TW-024
title: Build the mobile bottom tab bar and responsive sidebar collapse
type: feat
area:
  - apps/web
  - packages/core
phase: 6
status: backlog
priority: p2
created: 2026-06-23
acceptance:
  - below ~860px the sidebar becomes a fixed bottom tab bar (Home/Library/Marketplace/Create/Account)
  - targets are large and accessible
  - the active tab is indicated
---

## Context

At <= ~860px the sidebar collapses to a fixed bottom tab bar (Home, Library, Marketplace, Create, Account). Maker audience skews mobile. Spec §1. (Phase 6 sub-phase 6b.) From the Studio redesign handoff at `apps/studio/docs/redesign/`.

## Scope

In: Build the bottom tab bar + the responsive collapse from sidebar to tabs at the breakpoint; big-target, glanceable.

Out: Per-screen mobile layouts land with each screen.

Depends on: TW-021.

## Acceptance

- [ ] below ~860px the sidebar becomes a fixed bottom tab bar (Home/Library/Marketplace/Create/Account)
- [ ] targets are large and accessible
- [ ] the active tab is indicated

## Log

- 2026-06-23 created (Phase 6 re-scope from the studio redesign handoff).

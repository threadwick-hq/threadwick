---
id: TW-022
title: Build the topbar with search/Cmd+K trigger, notifications bell and Import/New
type: feat
area:
  - apps/web
  - packages/core
  - packages/icons
phase: 6
status: backlog
priority: p2
created: 2026-06-23
acceptance:
  - ⌘K opens the palette shell and the topbar trigger works
  - the bell shows an unread count and opens the inbox shell
  - Import/New is reachable
---

## Context

Global search (⌘K, spans library + marketplace), a notifications bell with unread count + unified inbox, and Import/New. Spec §1 (topbar + notifications). (Phase 6 sub-phase 6b.) From the Studio redesign handoff at `apps/studio/docs/redesign/`.

## Scope

In: Build the topbar: the ⌘K command-palette shell + keybinding (result population owned elsewhere), the bell + unread badge + inbox shell with All/Activity/Shop filter, and the Import/New entry.

Out: Search result population; notification event sources (networked layer).

Depends on: TW-020.

## Acceptance

- [ ] ⌘K opens the palette shell and the topbar trigger works
- [ ] the bell shows an unread count and opens the inbox shell
- [ ] Import/New is reachable

## Log

- 2026-06-23 created (Phase 6 re-scope from the studio redesign handoff).

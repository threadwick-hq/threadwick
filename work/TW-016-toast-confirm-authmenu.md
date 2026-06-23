---
id: TW-016
title: Replace App.useApp() with a shadcn toast and confirm layer and migrate AuthMenu
type: refactor
area:
  - apps/studio
  - packages/core
phase: 6
status: backlog
priority: p2
created: 2026-06-23
acceptance:
  - a toast + confirm layer lives in @threadwick/core and replaces App.useApp()
  - all 14 message/confirm sites are migrated
  - AuthMenu renders with no AntD
---

## Context

AntD App.useApp() backs 8 message.* (AuthMenu) and 6 modal.confirm sites. Replace with a small bespoke toast + confirm layer in @threadwick/core. Spec §1. (Phase 6 sub-phase 6c.) From the Studio redesign handoff at `apps/studio/docs/redesign/`.

## Scope

In: Add a sonner-style toast + a confirm dialog to @threadwick/core; migrate the 8 message.* and 6 modal.confirm call sites; rebuild AuthMenu chrome on shadcn.

Out: AntD package removal (TW-017).

Depends on: TW-015.

## Acceptance

- [ ] a toast + confirm layer lives in @threadwick/core and replaces App.useApp()
- [ ] all 14 message/confirm sites are migrated
- [ ] AuthMenu renders with no AntD

## Log

- 2026-06-23 created (Phase 6 re-scope from the studio redesign handoff).

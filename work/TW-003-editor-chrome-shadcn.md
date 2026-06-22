---
id: TW-003
title: Migrate the editor chrome from AntD to shadcn
type: refactor
area:
  - packages/editor
  - apps/studio
phase: 6
status: backlog
priority: p1
created: 2026-06-22
blocked_by:
  - TW-002
acceptance:
  - the 3 forms use react-hook-form with validation/error parity on the auth path
  - App.useApp() is replaced by a small toast + confirm layer (8 message.* + 6 modal.confirm)
  - Segmented/Select/Dropdown/Modal are shadcn equivalents
---

## Context

Phase 6, step 2. The editor chrome still uses AntD. Move it to shadcn so the editor carries no AntD
into apps/web. See MIGRATION.md Phase 6.

## Scope

In: forms -> react-hook-form; toast/confirm layer; Segmented/Select/Dropdown/Modal -> shadcn.
Out: the editor canvas (already AntD-free).

## Acceptance

- [ ] 3 forms on react-hook-form, auth-path parity verified
- [ ] toast + confirm layer replaces App.useApp()
- [ ] Segmented/Select/Dropdown/Modal on shadcn

## Log

- 2026-06-22 created.

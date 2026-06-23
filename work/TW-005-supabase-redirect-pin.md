---
id: TW-005
title: Pin Supabase redirectTo to a fixed /studio/auth/callback
type: fix
area:
  - apps/web
  - apps/studio
phase: 6
status: abandoned
priority: p2
created: 2026-06-22
blocked_by:
  - TW-004
acceptance:
  - redirectTo is the fixed /studio/auth/callback, not origin+pathname
  - the callback is on the Supabase allow-list
  - supabase + cloud/* stay behind import() so SSR + the PWA exclude them
---

## Context

Phase 6, step 4. The auth redirect must be a fixed path so SSR and the PWA build behave, and
supabase must stay dynamically imported. See MIGRATION.md Phase 6.

## Scope

In: fixed redirectTo, allow-list entry, import() gating of supabase + cloud/*.
Out: the broader client-only mount (TW-004).

## Acceptance

- [ ] redirectTo fixed to /studio/auth/callback
- [ ] callback added to the Supabase allow-list
- [ ] supabase + cloud/* behind import()

## Log

- 2026-06-22 created.
- 2026-06-23 abandoned: superseded by TW-048 (same work, renumbered into the Phase-6 batch).

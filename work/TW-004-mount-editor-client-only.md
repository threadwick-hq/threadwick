---
id: TW-004
title: Mount @threadwick/editor in apps/web as a client-only /studio route
type: feat
area:
  - apps/web
  - packages/editor
phase: 6
status: abandoned
priority: p1
created: 2026-06-22
blocked_by:
  - TW-002
acceptance:
  - /studio is a client-only route with no server loader
  - no window/localStorage in the server bundle; supabase absent from SSR + initial bundle
  - the localStorage store + window.threadwick are preserved; marketing routes still SSR
---

## Context

Phase 6, step 3. Mount the extracted editor in apps/web as a client-only route, keeping the
browser-only bootstrap out of SSR. See MIGRATION.md Phase 6.

## Scope

In: the /studio client-only route, browser-only bootstrap isolation, store + window.threadwick.
Out: the Supabase redirect pinning (TW-005) and the asset-path audit (TW-006).

## Acceptance

- [ ] /studio client-only, no server loader
- [ ] server bundle free of window/localStorage; supabase out of SSR + initial bundle
- [ ] store seeds + autosaves; window.threadwick inspectable; marketing still SSR

## Log

- 2026-06-22 created.
- 2026-06-23 abandoned: superseded by TW-019 (Phase 6 re-scope: acceptance preserved verbatim).

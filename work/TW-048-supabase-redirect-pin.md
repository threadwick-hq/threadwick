---
id: TW-048
title: Pin Supabase redirectTo to a fixed /studio/auth/callback
type: fix
area:
  - apps/web
  - apps/studio
phase: 6
status: backlog
priority: p2
created: 2026-06-23
acceptance:
  - redirectTo is a single fixed /studio/auth/callback on the allow-list
  - auth works from any entry path
  - supabase stays out of the SSR + initial bundle
---

## Context

Supersedes TW-005, renumbered into the Phase-6 batch. auth.ts redirectTo() currently returns origin+pathname; it must be a single fixed callback on the allow-list. Spec §8 (networked/auth layer). (Phase 6 sub-phase repo.) From the Studio redesign handoff at `apps/studio/docs/redesign/`.

## Scope

In: Pin redirectTo to a fixed /studio/auth/callback on the Supabase allow-list; keep supabase + cloud/* behind import() so they stay out of SSR + the initial bundle.

Out: The broader auth UX.

Depends on: nothing (can start now).

## Acceptance

- [ ] redirectTo is a single fixed /studio/auth/callback on the allow-list
- [ ] auth works from any entry path
- [ ] supabase stays out of the SSR + initial bundle

## Log

- 2026-06-23 created (Phase 6 re-scope from the studio redesign handoff).

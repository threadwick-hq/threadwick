---
id: TW-019
title: Mount /studio as a client-only RR7 route with isolated browser bootstrap
type: feat
area:
  - apps/web
  - packages/editor
phase: 6
status: active
priority: p1
created: 2026-06-23
assignee: agent
started: 2026-06-23
acceptance:
  - /studio is client-only: no window/localStorage in the server bundle; supabase absent from SSR + initial bundle
  - the editor loads, store seeds + autosaves, window.threadwick inspectable
  - marketing routes still stream SSR
---

## Context

Supersedes the old TW-004. The editor is client-only; it must not reach streaming SSR. Spec §1. (Phase 6 sub-phase 6b.) From the Studio redesign handoff at `apps/studio/docs/redesign/`.

## Scope

In: Add a strictly client-only /studio* nested route in apps/web (clientLoader only, HydrateFallback, browser bootstrap isolated; supabase + cloud/* behind import()). Consume the @threadwick/editor browser-only entry.

Out: The shell layout + nav (TW-020/021). Marketing routes stay SSR.

Depends on: TW-011.

## Acceptance

- [ ] /studio is client-only: no window/localStorage in the server bundle; supabase absent from SSR + initial bundle
- [ ] the editor loads, store seeds + autosaves, window.threadwick inspectable
- [ ] marketing routes still stream SSR

## Log

- 2026-06-23 created (Phase 6 re-scope from the studio redesign handoff).

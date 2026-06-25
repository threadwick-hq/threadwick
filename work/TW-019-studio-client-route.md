---
id: TW-019
title: Mount /studio as a client-only RR7 route with isolated browser bootstrap
type: feat
area:
  - apps/web
  - packages/editor
phase: 6
status: done
priority: p1
created: 2026-06-23
assignee: agent
started: 2026-06-23
completed: 2026-06-23
pr: 13
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

- [x] /studio is client-only: no window/localStorage in the server bundle; supabase absent from SSR + initial bundle
- [x] the editor loads, store seeds + autosaves, window.threadwick inspectable
- [x] marketing routes still stream SSR

## Log

- 2026-06-23 created (Phase 6 re-scope from the studio redesign handoff).
- 2026-06-23 claimed.
- 2026-06-23 Added a client-only /studio* route in apps/web: routes/studio.tsx
  (clientLoader + hydrate + HydrateFallback) and studio/editor-mount.tsx, which
  dynamically imports @threadwick/editor/browser inside a client effect so no
  window/localStorage code reaches the SSR-executed server bundle (verified: the
  server entry has 0 localStorage refs and references the editor's browser chunk
  only via dynamic import()). Editor seeds the sample, autosaves, exposes
  window.threadwick; marketing routes still SSR. supabase is absent (apps/web has
  no cloud). Also fixed a PRE-EXISTING (reproduces on main) apps/web dev-optimizer
  React-dup — dedupe react/react-dom + pre-bundle the workspace barrels (TW-014
  added heavy core deps that Vite discovers lazily through export* dist barrels).
  PR #13. Shell/nav → TW-020/021.
- 2026-06-23 Adversarial code-review workflow (4 lenses): 1 major confirmed (3 refuted,
  incl. SSR-isolation positively verified). Fixed: the store singleton survives client
  navigation, so loadLocal() on every mount clobbered live state on navigate-back —
  gated load+seed behind a one-time hydrated flag. Merged via PR #13.

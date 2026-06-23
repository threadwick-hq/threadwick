---
id: TW-049
title: Audit and fix hardcoded /studio/ absolute asset paths in studio source
type: chore
area:
  - apps/studio
phase: 6
status: backlog
priority: p3
created: 2026-06-23
acceptance:
  - no hardcoded /studio/ absolute asset paths remain (or they resolve correctly under the mount)
  - assets load on the /studio route
  - the audit is documented in the task body
---

## Context

Supersedes TW-006, renumbered into the Phase-6 batch. Now that /studio is an internal RR7 route, hardcoded /studio/ asset paths must resolve correctly. (Phase 6 sub-phase repo.) From the Studio redesign handoff at `apps/studio/docs/redesign/`.

## Scope

In: Audit studio source for hardcoded /studio/ absolute asset paths and fix them to resolve under the RR7 mount.

Out: No behaviour change beyond correct asset resolution.

Depends on: nothing (can start now).

## Acceptance

- [ ] no hardcoded /studio/ absolute asset paths remain (or they resolve correctly under the mount)
- [ ] assets load on the /studio route
- [ ] the audit is documented in the task body

## Log

- 2026-06-23 created (Phase 6 re-scope from the studio redesign handoff).

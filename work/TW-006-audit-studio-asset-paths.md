---
id: TW-006
title: Audit studio source for hardcoded /studio/ absolute asset paths
type: chore
area:
  - apps/studio
phase: 6
status: backlog
priority: p3
created: 2026-06-22
acceptance:
  - no hardcoded /studio/ absolute asset paths remain that break under the RR7 route
---

## Context

Phase 6, step 5. Hardcoded `/studio/` asset paths break once the editor is an internal RR7 route.
See MIGRATION.md Phase 6.

## Scope

In: find and fix hardcoded /studio/ absolute asset references in studio source.
Out: route mounting and auth (TW-004, TW-005).

## Acceptance

- [ ] no breaking hardcoded /studio/ absolute asset paths remain

## Log

- 2026-06-22 created.

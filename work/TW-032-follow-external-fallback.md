---
id: TW-032
title: Add the external-pattern Follow fallback (Ravelry/PDF to checklist or open source)
type: feat
area:
  - apps/web
  - packages/editor
phase: 6
status: backlog
priority: p2
created: 2026-06-23
acceptance:
  - an external pattern follows via a plain round checklist or opens its source
  - progress is tracked for the external pattern in the project
  - the structured Follow view is used only when chart data exists
---

## Context

External patterns (Ravelry link / PDF) lack structured data, so Follow falls back to a plain round checklist or opens the source. Spec §6 (open behaviours). (Phase 6 sub-phase 6d.) From the Studio redesign handoff at `apps/studio/docs/redesign/`.

## Scope

In: Add the fallback path: a plain round checklist for patterns without structured data, or open the external source; per-pattern progress still tracked.

Out: No decomposition for external patterns.

Depends on: TW-028.

## Acceptance

- [ ] an external pattern follows via a plain round checklist or opens its source
- [ ] progress is tracked for the external pattern in the project
- [ ] the structured Follow view is used only when chart data exists

## Log

- 2026-06-23 created (Phase 6 re-scope from the studio redesign handoff).

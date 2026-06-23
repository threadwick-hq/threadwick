---
id: TW-043
title: Add the Home second block (discovery/library), creator teaser and the decouple flag
type: feat
area:
  - apps/web
phase: 6
status: backlog
priority: p3
created: 2026-06-23
acceptance:
  - the second block shows discovery when the marketplace is on, else a library peek
  - the creator teaser appears only for published creators
  - with the flag off, discovery + teaser drop and Home still feels complete
---

## Context

One second block: marketplace discovery when on, else a larger library peek; plus a calm creator teaser if published. Decouple test: off -> both drop, the rest stands. Spec §3. (Phase 6 sub-phase 6e.) From the Studio redesign handoff at `apps/studio/docs/redesign/`.

## Scope

In: Add the second block (discovery when the marketplace flag is on + has suggestions, else a larger library peek) + the creator teaser (only if published), all behind the capability flag.

Out: Discovery data population (marketplace adapter).

Depends on: TW-042, TW-046.

## Acceptance

- [ ] the second block shows discovery when the marketplace is on, else a library peek
- [ ] the creator teaser appears only for published creators
- [ ] with the flag off, discovery + teaser drop and Home still feels complete

## Log

- 2026-06-23 created (Phase 6 re-scope from the studio redesign handoff).

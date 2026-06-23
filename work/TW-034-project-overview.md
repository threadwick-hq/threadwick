---
id: TW-034
title: Build the Project Overview screen and Ravelry status mapping (capability-flagged)
type: feat
area:
  - apps/web
  - packages/core
  - packages/types
phase: 6
status: backlog
priority: p2
created: 2026-06-23
acceptance:
  - Overview shows state, progress photos, patterns-in-this-make, key facts, and from-stash tags
  - status states map to/from Ravelry behind the capability flag
  - offline (flag off) the screen stays complete
---

## Context

Overview: title + state, progress photos, patterns-in-this-make (per-pattern progress + Continue/Open), key facts, yarns & tools used with from-stash tags. States sync to Ravelry. Spec §5. (Phase 6 sub-phase 6e.) From the Studio redesign handoff at `apps/studio/docs/redesign/`.

## Scope

In: Build the Overview screen + the maker status states (Draft/In progress/On hold/Done/Frogged) with the Ravelry mapping behind a capability flag; the yarns/tools picker (stash-default, Ravelry search, add-to-stash prompt) folds in here / from Library.

Out: Marketplace/Ravelry live source (fixture seed for now).

Depends on: TW-033, TW-028.

## Acceptance

- [ ] Overview shows state, progress photos, patterns-in-this-make, key facts, and from-stash tags
- [ ] status states map to/from Ravelry behind the capability flag
- [ ] offline (flag off) the screen stays complete

## Log

- 2026-06-23 created (Phase 6 re-scope from the studio redesign handoff).

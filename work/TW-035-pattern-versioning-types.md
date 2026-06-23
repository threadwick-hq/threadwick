---
id: TW-035
title: Add whole-pattern versioning, publish, remix and lineage types to @threadwick/types (Phase-7 anchor)
type: feat
area:
  - packages/types
phase: 6
status: backlog
priority: p2
created: 2026-06-23
acceptance:
  - @threadwick/types encodes whole-pattern versioning/publish/remix/lineage as a read contract
  - pattern.schema.json reflects it
  - the body notes the data-layer re-seating is Phase 7
---

## Context

The Pattern interior needs a contract for the versioning/publish/remix model even though the full data-layer re-seating defers to Phase 7. Spec §4.3. (Phase 6 sub-phase 6e.) From the Studio redesign handoff at `apps/studio/docs/redesign/`.

## Scope

In: Anchor the types: whole-pattern published/private, linear versions with <=1 draft, buy-once-yours-forever, unpublish, remix + lineage. Types only; the data-layer re-seating (publishVersion/createDraft/isDraftActive onto Pattern) is a Phase 7 task.

Out: The data-layer re-seating + its migration (Phase 7).

Depends on: TW-026.

## Acceptance

- [ ] @threadwick/types encodes whole-pattern versioning/publish/remix/lineage as a read contract
- [ ] pattern.schema.json reflects it
- [ ] the body notes the data-layer re-seating is Phase 7

## Log

- 2026-06-23 created (Phase 6 re-scope from the studio redesign handoff).

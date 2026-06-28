---
id: TW-035
title: Add whole-pattern versioning, publish, remix and lineage types to @threadwick/types (Phase-7 anchor)
type: feat
area:
  - packages/types
phase: 6
status: active
priority: p2
created: 2026-06-23
assignee: agent
started: 2026-06-28
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

- [x] @threadwick/types encodes whole-pattern versioning/publish/remix/lineage as a read contract
- [x] pattern.schema.json reflects it
- [x] the body notes the data-layer re-seating is Phase 7

## Decisions

- **`PatternVersioning` on `Pattern`** carries whole-pattern `visibility`, a linear `versions[]`,
  and `activeVersionId`. `unpublishedAt` captures the Unpublish timestamp while `visibility` flips
  back to `private` (§4.3). Invariants (≤1 draft, ≤1 published, linear only) are documented and
  deferred to Phase 7 runtime enforcement — JSON Schema cannot express them.
- **`PatternVersionStatus` aligns with `@threadwick/editor`'s `VersionStatus`** (`draft |
  published | outdated`) so Phase 7 can migrate `ProjectVersion` → `PatternVersion` without a
  rename.
- **`PatternLineage` is optional on `Pattern`** for Remixed patterns — carries denormalised
  `remixedFromLabel` / `remixedFromDesigner` so view surfaces render attribution without resolving
  the source pattern.
- **`PatternOwnership` is a standalone per-viewer read contract**, not stored on `Pattern` —
  encodes buy-once-yours-forever (`owned`, `purchasedAt`) and the maker's `lastViewedVersionId`
  pin for the "newer version available" banner (§4.3).
- **`workingCopy` stays as a legacy placeholder** — Phase 7 re-seats publish/draft onto
  `Pattern.versioning` and migrates off `WorkingCopyRef`.

## Phase 7 (deferred)

The data-layer re-seating — moving `publishVersion` / `createDraft` / `isDraftActive` from the
editor's authoring `Project` onto `Pattern`, bumping `FILE_VERSION`, and migrating existing
`threadwickstudio:v2` data — is **Phase 7**, not this task.

## Log

- 2026-06-28 claimed by agent; landed `PatternVersioning`, `PatternVersion`, `PatternLineage`,
  `PatternOwnership`, and schema mirror.
- 2026-06-23 created (Phase 6 re-scope from the studio redesign handoff).

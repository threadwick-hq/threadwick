---
id: TW-026
title: Land the maker-plane Project model (references, progress, status, follow-mode) in @threadwick/types
type: feat
area:
  - packages/types
phase: 6
status: review
priority: p1
created: 2026-06-23
assignee: agent
started: 2026-06-27
pr: 16
acceptance:
  - @threadwick/types encodes the maker-plane Project (references + progress + status + follow-mode)
  - pattern.schema.json mirrors the additions
  - the types are designed as the first Phase-7 increment (one model, not a fork)
---

## Context

The Follow view structurally needs two top-level collections + a place for progress. This is the FIRST increment of the Phase 7 model unification, co-owned, not a fork. Spec §5, §6, §10. (Phase 6 sub-phase 6d.) From the Studio redesign handoff at `apps/studio/docs/redesign/`.

## Scope

In: Flesh out the Project stub in @threadwick/types: pattern references with source tags (threadwick/Ravelry/blog/PDF), per-pattern follow mode, the maker status union + Ravelry mapping, and a progress cursor. Mirror pattern.schema.json.

Out: The full Pattern-as-root re-seating (Phase 7; only its types anchored in TW-035). The store/data migration (TW-028).

Depends on: nothing (can start now).

## Acceptance

- [x] @threadwick/types encodes the maker-plane Project (references + progress + status + follow-mode)
- [x] pattern.schema.json mirrors the additions
- [x] the types are designed as the first Phase-7 increment (one model, not a fork)

## Decisions

- **PatternReference is a discriminated union on `source`** (`threadwick | ravelry | blog | pdf`,
  §5). Internal refs carry `patternId` (a live FK into the authoring `Pattern`); external refs carry
  `url`/`file` + a denormalised `label`/`designer` so the rail renders without resolving the ref and
  Follow degrades to a checklist (§6, TW-032). Each ref has its **own** `id` (distinct from
  `patternId`) so progress/follow-mode key off a stable per-make handle.
- **`FollowMode` adds an explicit `checklist`** member for the external/unstructured fallback, so no
  surface re-infers the fallback from `source`. The maker's `followMode` is kept separate from the
  pattern's `suggestedFollowMode` so a reset never clobbers the override.
- **Progress stores only the cursor + `unitsDone`** (+ an optional `unitsTotal` cache). Every counter
  pill (`Round 3/5`, `Rep 2/6`), `square 18 of 40`, `45%`, `Squares left` is **derived** by
  re-decomposing at the cursor — never stored — so it can't drift from the chart. Overall project
  progress and *Continue making* are derived too (aggregated by TW-028), never stored fields.
- **`UnitAddress` is an opaque `string`**, not a structured `{round,repeat,cluster}` — TW-027's
  decomposition engine owns the grammar, so this contract doesn't reshape when a finer coordinate is
  added. This is the seam that keeps "one model, not a fork."
- **`MakerStatus` is its own plane** (`draft | in-progress | on-hold | done | frogged`), deliberately
  distinct from the editor's authoring `VersionStatus`. Three plain `const` maps (no runtime) encode
  §5's asymmetric Ravelry push/pull and the quiet status-dot colour tokens.
- **Materials reference, never own, the stash:** `UsedYarn`/`UsedTool` carry a denormalised label +
  optional `stashId` *from-stash* seam (TW-044 owns `StashYarn`/`OwnedTool`); `acquired` backs the
  mockup's "in my stash" vs "need to buy" checklist. Photos reuse the authoring `ImageRef`.
- **Schema closed fail-closed:** the root flips from a bare `Pattern` object to
  `oneOf: [Pattern, Project]` (old Pattern body lifted verbatim into `#/definitions/Pattern`), so a
  Project document actually validates rather than leaving a dangling, unguarded definition. Verified
  with ajv against valid Pattern/Project fixtures and 8 fail-closed rejection cases.
- **Seams left, not painted into corners:** TW-027 (opaque `UnitAddress`), TW-028 (`PatternProgress`
  shape + the migration below), TW-035 (`patternVersionId`), TW-044 (`stashId`). `timeLoggedMs` /
  `lastWorkedAt` are landed optional so §5's key-fact tiles have a home; TW-028 may relocate them.

## Migration forward (for TW-028)

The legacy `Project` stub was `{ id, name, patternIds: string[] }`. TW-028's `normalizeProject`
(FILE_VERSION 3→4, covering both `threadwickstudio:v2` and legacy `stitchgridstudio:v2`) upgrades it
idempotently: map each `patternIds[i]` → `{ id: uid('ref'), label: <resolved Pattern.overview.name |
''>, source: 'threadwick', patternId: pid }`; set `status` to `'draft'` when no reference has
progress; omit (never null/empty-array) every other optional field so a bare make stays deep-equal
stable on a second pass. `patterns` is a strict superset of `patternIds`, every added field is
optional/omit-not-null, so the `export → import → deep-equal` round-trip holds.

## Log

- 2026-06-23 created (Phase 6 re-scope from the studio redesign handoff).
- 2026-06-27 designed the maker-plane Project model via a 3-design judge-panel + adversarial review:
  source-tagged `PatternReference` discriminated union (threadwick/ravelry/blog/pdf), per-ref
  `FollowMode` (+`checklist` fallback) over an opaque `UnitAddress`, `MakerStatus` union with pure
  Ravelry/colour `const` maps, the Yarns·Tools·Notes·Photos rail with a from-stash `stashId` seam, and
  a thin `customSections` escape hatch; overall progress + Continue-making left derived. Mirrored in
  `pattern.schema.json` by flipping the root to `oneOf: [Pattern, Project]` (closing the fail-closed
  gap); validated with ajv. Forward-migration of the `{patternIds}` stub specified for TW-028.

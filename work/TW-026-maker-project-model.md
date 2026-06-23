---
id: TW-026
title: Land the maker-plane Project model (references, progress, status, follow-mode) in @threadwick/types
type: feat
area:
  - packages/types
phase: 6
status: backlog
priority: p1
created: 2026-06-23
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

- [ ] @threadwick/types encodes the maker-plane Project (references + progress + status + follow-mode)
- [ ] pattern.schema.json mirrors the additions
- [ ] the types are designed as the first Phase-7 increment (one model, not a fork)

## Log

- 2026-06-23 created (Phase 6 re-scope from the studio redesign handoff).

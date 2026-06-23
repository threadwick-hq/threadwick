---
id: TW-047
title: Build the Marketplace catalogue adapter and the Home and Browse routes (capability-gated)
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
  - Marketplace Home shows curated rows + a designer spotlight, no filter bar
  - Browse is one filterable grid with a Category-first facet header and pinned applied filters
  - Following/Free/Wishlist deep-link into pre-filtered Browse; all gated by the capability flag
---

## Context

Two screens: Home (curated storefront, search + curated rows + spotlight, no filter bar) and Browse (one filterable view, Category-first facet header, applied-filters pin). Spec §8. (Phase 6 sub-phase 6e.) From the Studio redesign handoff at `apps/studio/docs/redesign/`.

## Scope

In: Build the catalogue data adapter (query + facets + search) and the Marketplace Home (curated rows + spotlight) and Browse (grid + secondary-header facet row, Category first, applied-filters pin) routes; wire Following/Free/Wishlist as pre-filtered Browse deep-links.

Out: Buy/payment rails (later); live catalogue source.

Depends on: TW-046, TW-049.

## Acceptance

- [ ] Marketplace Home shows curated rows + a designer spotlight, no filter bar
- [ ] Browse is one filterable grid with a Category-first facet header and pinned applied filters
- [ ] Following/Free/Wishlist deep-link into pre-filtered Browse; all gated by the capability flag

## Log

- 2026-06-23 created (Phase 6 re-scope from the studio redesign handoff).

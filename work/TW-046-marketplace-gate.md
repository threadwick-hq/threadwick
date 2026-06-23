---
id: TW-046
title: Add the runtime marketplace capability flag, MarketplaceGate and catalogue listing types
type: feat
area:
  - packages/core
  - packages/types
  - apps/web
phase: 6
status: backlog
priority: p2
created: 2026-06-23
acceptance:
  - a runtime capability flag gates all marketplace UI via MarketplaceGate
  - with the flag off, no marketplace nav/surfaces render and the app stays complete
  - @threadwick/types encodes CatalogueListing + facets
---

## Context

The marketplace is native but decouplable behind a capability flag so the offline/private app stays complete. Spec §8. (Phase 6 sub-phase 6e.) From the Studio redesign handoff at `apps/studio/docs/redesign/`.

## Scope

In: Add the runtime marketplace capability flag + a MarketplaceGate component, and the CatalogueListing + facet types in @threadwick/types.

Out: The catalogue adapter + routes (TW-047).

Depends on: TW-020.

## Acceptance

- [ ] a runtime capability flag gates all marketplace UI via MarketplaceGate
- [ ] with the flag off, no marketplace nav/surfaces render and the app stays complete
- [ ] @threadwick/types encodes CatalogueListing + facets

## Log

- 2026-06-23 created (Phase 6 re-scope from the studio redesign handoff).

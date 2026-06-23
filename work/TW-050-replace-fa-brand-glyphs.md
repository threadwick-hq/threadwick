---
id: TW-050
title: Replace the Font-Awesome-derived Studio/Marketplace brand glyphs with originals (pre-public gate)
type: chore
area:
  - packages/core
phase: 8
status: backlog
priority: p1
created: 2026-06-23
acceptance:
  - COMPASS_DRAFTING + STORE in packages/core/src/brand/glyphs.ts are original artwork, not Font Awesome geometry
  - no Font-Awesome-derived path data remains in committed brand marks
  - the brand-glyph generator (scripts/gen-brand-glyphs.ts) is still optional and never runs during build
---

## Context

`packages/core/src/brand/glyphs.ts` bakes the brand marks as static SVG path data. `REEL` (the
primary Threadwick mark) is **original artwork**, but `COMPASS_DRAFTING` (Studio) and `STORE`
(Marketplace) are **still Font Awesome geometry**, pending custom replacements (noted in the file
header). The repo is currently **private**; before it is flipped to **public**, these must be
replaced with originals so no Font Awesome path data is redistributed in an AGPL repo. Brand identity
should be original artwork regardless.

This is a **launch gate**, not migration work — it blocks taking the repo public, alongside settling
the marketplace licensing and the trademark clearance (owner-side, not tracked here).

## Scope

In: design + bake original SVG path data for the Studio and Marketplace brand marks into glyphs.ts,
matching the REEL mark's weight/grid; update the header comment.

Out: the `@threadwick/icons` runtime set (a separate, swappable system — FA there is fine under CC BY
with the NOTICE attribution). The owner-side launch items (trademark, VAT/OSS, flip-to-public).

Depends on: nothing (can be done any time before going public).

## Acceptance

- [ ] COMPASS_DRAFTING + STORE are original artwork, not Font Awesome geometry
- [ ] no Font-Awesome-derived path data remains in committed brand marks
- [ ] the brand-glyph generator stays optional and never runs during build

## Log

- 2026-06-23 created. Folded in from a hand-off pass — the FA provenance was only a `glyphs.ts`
  code comment + agent memory; tracked here so the public-launch gate is not forgotten.

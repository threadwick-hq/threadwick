---
id: TW-013
title: Add the editor's action glyphs to @threadwick/icons and swap iconoir out of studio
type: feat
area:
  - packages/icons
  - apps/studio
phase: 6
status: active
priority: p1
created: 2026-06-23
assignee: agent
started: 2026-06-23
acceptance:
  - every editor action renders via @threadwick/icons <Icon name>
  - iconoir-react removed from apps/studio
  - icons are action/intent-named, not glyph-named
---

## Context

The studio chrome uses ~34 iconoir aliases (src/icons.ts). They must become action-named <Icon> entries before the chrome drops iconoir-react. (Phase 6 sub-phase 6a.) From the Studio redesign handoff at `apps/studio/docs/redesign/`.

## Scope

In: Map the ~34 editor actions (select/insert/pan modes, undo/redo, zoom, fit, mirror, origin, add, etc.) to action-named IconName entries with fa-free glyphs; swap iconoir-react usage in studio for <Icon>.

Out: No new icon sets; fa-free baseline only (Pro stays optional).

Depends on: nothing (can start now).

## Acceptance

- [ ] every editor action renders via @threadwick/icons <Icon name>
- [ ] iconoir-react removed from apps/studio
- [ ] icons are action/intent-named, not glyph-named

## Log

- 2026-06-23 created (Phase 6 re-scope from the studio redesign handoff).

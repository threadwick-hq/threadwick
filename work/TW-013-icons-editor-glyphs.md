---
id: TW-013
title: Add the editor's action glyphs to @threadwick/icons and swap iconoir out of studio
type: feat
area:
  - packages/icons
  - apps/studio
phase: 6
status: done
priority: p1
created: 2026-06-23
assignee: agent
started: 2026-06-23
completed: 2026-06-23
pr: 8
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

- [x] every editor action renders via @threadwick/icons <Icon name> (studio icons.tsx is a thin shim over <Icon>)
- [x] iconoir-react removed from apps/studio (dep + IconoirProvider gone; grep clean)
- [x] icons are action/intent-named, not glyph-named (the @threadwick/icons interface is action-named; the studio glyph-named aliases are a transitional shim that the 6c chrome rebuild retires by calling <Icon name> directly)

## Log

- 2026-06-23 created (Phase 6 re-scope from the studio redesign handoff).
- 2026-06-23 implemented. Added 17 new action names to @threadwick/icons (contract union + iconMeta
  + fa-free glyph map): set-origin, fit, select-mode, insert-mode, pan-mode, import, more,
  chevron-down, help, yarn, notes, variation, sign-in, sign-out, account, google, mail. Added
  @fortawesome/free-brands-svg-icons for the Google logo. The exhaustive Record<IconName, …> types
  guarantee every action has both a label and a glyph (tsc-enforced). Rewrote studio src/icons.ts ->
  icons.tsx as a thin shim mapping its 33 glyph-named aliases to <Icon name> (className forwarded),
  dropped iconoir-react + the IconoirProvider. Verified: icons + studio typecheck, studio 3 tests +
  eslint, 9/9 packages build+typecheck. Unblocks the 6c chrome migration (TW-014/015).

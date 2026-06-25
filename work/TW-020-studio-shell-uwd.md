---
id: TW-020
title: Build the StudioShell layout route with the UWD cap-and-centre rule
type: feat
area:
  - apps/web
  - packages/core
phase: 6
status: done
priority: p1
created: 2026-06-23
assignee: agent
started: 2026-06-23
completed: 2026-06-23
pr: 14
acceptance:
  - StudioShell renders the sidebar + main frame
  - content caps and centers on ultra-wide; chrome stays fixed-width
  - the layout hosts a placeholder outlet for each destination
---

## Context

The frame every studio screen mounts into. Fixed-width chrome + content capped and centered; excess is calm margin. Spec §1, §0 (UWD rule). (Phase 6 sub-phase 6b.) From the Studio redesign handoff at `apps/studio/docs/redesign/`.

## Scope

In: Build the StudioShell layout route: the sidebar + main grid, the content-cap-and-centre rule app-wide, and the outlet that interiors take over.

Out: Sidebar contents (TW-021), topbar (TW-022), interiors.

Depends on: TW-019.

## Acceptance

- [x] StudioShell renders the sidebar + main frame
- [x] content caps and centers on ultra-wide; chrome stays fixed-width
- [x] the layout hosts a placeholder outlet for each destination

## Log

- 2026-06-23 created (Phase 6 re-scope from the studio redesign handoff).
- 2026-06-23 claimed.
- 2026-06-23 Split apps/web routing into a marketing layout (header/footer SSR) and a
  full-takeover, client-only StudioShell layout: 244px fixed sidebar frame + main with the
  app-wide UWD cap-and-centre (new core --container-uwd / max-w-uwd, 1440px). Children: Home
  (index), the editor, and a generic :section placeholder. Verified headless at 1920px (caps
  at 1440 + centres, sidebar 244) and 375px (sidebar hidden), editor mounts in-shell, SSR
  unchanged (/ marketing, /studio shell skeleton only, 0 localStorage server-side). PR #14.
  Sidebar nav → TW-021; topbar → TW-022; mobile bottom bar → TW-024.
- 2026-06-23 Adversarial code-review workflow (4 lenses): 1 major confirmed (1 refuted as
  TW-021 scope) — moving the marketing chrome out of root dropped the skip-to-content link
  for the /studio subtree; restored it in StudioShell targeting #studio-main. Re-verified
  responsiveness at 375/768/1280/1920. Merged via PR #14.

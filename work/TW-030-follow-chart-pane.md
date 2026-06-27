---
id: TW-030
title: Build the Follow chart pane (state styling, follow-position, zoom, tap-to-inspect)
type: feat
area:
  - apps/web
  - packages/editor
phase: 6
status: review
pr: 23
priority: p1
created: 2026-06-23
acceptance:
  - rounds render completed/lit/ghosted and the pane follows the cursor position
  - zoom and tap-to-inspect work
  - the pane consumes editor read primitives, not studio internals
assignee: agent
started: 2026-06-27
---
## Context

A big interactive chart pane: completed rounds solid, current lit, later ghosted; it follows the current bite/cluster in finer modes; zoom + tap-to-inspect. Reuses the editor read primitives. Spec §6. (Phase 6 sub-phase 6d.) From the Studio redesign handoff at `apps/studio/docs/redesign/`.

## Scope

In: Build the chart pane over the @threadwick/editor read primitives: completed/lit/ghosted state styling, follow-position tracking the cursor (round in per-row, bite/cluster in finer modes), zoom, tap-a-stitch-to-inspect.

Out: Responsive composition (TW-031).

Depends on: TW-028.

## Acceptance

- [x] rounds render completed/lit/ghosted and the pane follows the cursor position
- [x] zoom and tap-to-inspect work
- [x] the pane consumes editor read primitives, not studio internals

## Log

- 2026-06-28 published PR #23 (stacked on TW-029); Graphite Agent review pending.
- 2026-06-27 claimed by agent; added `follow-chart.ts` read primitives + `FollowChartPane` in apps/web.
- 2026-06-23 created (Phase 6 re-scope from the studio redesign handoff).

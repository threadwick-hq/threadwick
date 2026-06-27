---
id: TW-029
title: Build the Follow instruction box, counter pills and mode selector (phone baseline)
type: feat
area:
  - apps/web
  - packages/core
phase: 6
status: active
priority: p1
created: 2026-06-23
acceptance:
  - the instruction box renders Start/Round/Finish with the one big action driving the cursor
  - the mode selector switches granularity and is remembered per project
  - counter pills are display-only; Undo steps back once
assignee: agent
started: 2026-06-27
---
## Context

The Follow view is the most important surface, designed phone-first. Instruction box split Start/Round/Finish, display-only counter pills, the Per-row/Pattern/Granular mode selector, one big action + Undo. Spec §6. (Phase 6 sub-phase 6d.) From the Studio redesign handoff at `apps/studio/docs/redesign/`.

## Scope

In: Build the phone-baseline Follow surface: the Start/Round/Finish instruction box (stitch tokens emphasised, connectors italic, why-comments, per-section accordion-on-check), display-only counter pills, the mode selector (remembered per project), and the footer one-big-action + Undo.

Out: Chart pane (TW-030), responsive shell (TW-031).

Depends on: TW-028, TW-020.

## Acceptance

- [x] the instruction box renders Start/Round/Finish with the one big action driving the cursor
- [x] the mode selector switches granularity and is remembered per project
- [x] counter pills are display-only; Undo steps back once

## Log

- 2026-06-28 implemented phone-baseline Follow UI: `follow-ui.ts` helpers, `@threadwick/core` Follow components (mode selector, counter pills, instruction box, footer), `/studio/follow/:projectId/:refId` route + editor entry link; sample seeds `makePatterns`.
- 2026-06-27 claimed by agent.
- 2026-06-23 created (Phase 6 re-scope from the studio redesign handoff).

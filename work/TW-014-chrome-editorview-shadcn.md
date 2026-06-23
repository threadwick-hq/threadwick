---
id: TW-014
title: Migrate the EditorView toolbar and inspector chrome from AntD to shadcn
type: refactor
area:
  - apps/studio
  - packages/editor
phase: 6
status: backlog
priority: p1
created: 2026-06-23
acceptance:
  - EditorView renders with no AntD imports
  - the editor CSS grid (.editor, .ed-body) is intact via modifier classes
  - toolbar/inspector interactions behave as before
---

## Context

EditorView is the heaviest AntD surface (Segmented, Select, Dropdown, Tooltip, InputNumber, ColorPicker, Switch). Rebuild on @threadwick/core shadcn primitives. Spec §4. (Phase 6 sub-phase 6c.) From the Studio redesign handoff at `apps/studio/docs/redesign/`.

## Scope

In: Rebuild the EditorView toolbar + inspector on shadcn (adding any missing primitives to @threadwick/core/components/ui: Segmented, Dropdown, Tooltip, InputNumber, ColorPicker, Switch). Hold the editor CSS-grid gotcha (modifier classes; never add/remove grid children).

Out: ProjectView/TopBar/AuthMenu (TW-015/016). Final AntD removal (TW-017).

Depends on: TW-011, TW-013.

## Acceptance

- [ ] EditorView renders with no AntD imports
- [ ] the editor CSS grid (.editor, .ed-body) is intact via modifier classes
- [ ] toolbar/inspector interactions behave as before

## Log

- 2026-06-23 created (Phase 6 re-scope from the studio redesign handoff).

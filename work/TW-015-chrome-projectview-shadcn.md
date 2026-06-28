---
id: TW-015
title: Migrate ProjectView, ProjectsView and TopBar/VersionTag from AntD to shadcn
type: refactor
area:
  - apps/studio
phase: 6
status: review
priority: p2
created: 2026-06-23
started: 2026-06-28
assignee: agent
branch: feat/TW-015-chrome-projectview-shadcn
pr: 39
acceptance:
  - ProjectView/ProjectsView/TopBar render with no AntD
  - the publish/discard version bar interaction is preserved
  - forms use react-hook-form
---

## Context

The project/list/topbar chrome (Modal, Breadcrumb, Alert, Input, version bar) on AntD. Rebuild on shadcn. Spec §4.3. (Phase 6 sub-phase 6c.) From the Studio redesign handoff at `apps/studio/docs/redesign/`.

## Scope

In: Rebuild ProjectView, ProjectsView, TopBar and the VersionTag/version bar on shadcn primitives; 3 forms move to react-hook-form.

Out: App.useApp() toast/confirm + AuthMenu (TW-016).

Depends on: TW-013.

## Acceptance

- [x] ProjectView/ProjectsView/TopBar render with no AntD
- [x] the publish/discard version bar interaction is preserved
- [x] forms use react-hook-form

## Log

- 2026-06-23 created (Phase 6 re-scope from the studio redesign handoff).
- 2026-06-28 claimed by agent; migrated ProjectView, ProjectsView, VersionTag to shadcn; three dialogs (new project, new pattern, resource) use react-hook-form; publish/discard/delete confirms use AlertDialog; TopBar was already AntD-free.

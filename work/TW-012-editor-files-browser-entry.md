---
id: TW-012
title: Move files.ts (import/export, SVG/PNG, print-PDF) into the editor browser-only entry
type: refactor
area:
  - packages/editor
  - apps/studio
phase: 6
status: backlog
priority: p2
created: 2026-06-23
acceptance:
  - files.ts lives behind the browser-only entry; SSR never imports it
  - export -> import -> deep-equal round-trip stays green
  - studio import/export/print behaviour unchanged
---

## Context

files.ts owns import/export JSON, SVG/PNG export, and the print-PDF composer (qrcode). DOM download/print helpers, browser-only. (Phase 6 sub-phase 6a.) From the Studio redesign handoff at `apps/studio/docs/redesign/`.

## Scope

In: Move files.ts DOM helpers (import/export download, SVG/PNG, print-PDF) into the browser-only subpath; the pure summarizeRound already moved to the core in TW-010. Keep the export->import->deep-equal round-trip covered by the moved test. Re-point apps/studio.

Out: No format change; data-ownership round-trip must stay lossless.

Depends on: TW-010.

## Acceptance

- [ ] files.ts lives behind the browser-only entry; SSR never imports it
- [ ] export -> import -> deep-equal round-trip stays green
- [ ] studio import/export/print behaviour unchanged

## Log

- 2026-06-23 created (Phase 6 re-scope from the studio redesign handoff).

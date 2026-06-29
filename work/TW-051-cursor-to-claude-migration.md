---
id: TW-051
title: Migrate agent config from Cursor to generic + Claude Code
type: chore
area:
  - repo
phase: 0
status: done
priority: p2
created: 2026-06-29
assignee: claude
started: 2026-06-29
completed: 2026-06-29
pr: 44
acceptance:
  - AGENTS.md is the tool-agnostic source of truth with no Cursor-specific framing
  - CLAUDE.md (root and apps/studio) imports the matching AGENTS.md via @import instead of being a redirect stub
  - .mcp.json at repo root provides the antd MCP server (replacing .cursor/mcp.json)
  - .claude/settings.json wires SessionStart and PostToolUse hooks with Claude Code's JSON schema
  - .claude/hooks/ scripts are executable and emit hookSpecificOutput.additionalContext
  - .cursor/ is removed and no .cursor references remain outside historical/domain text
links:
  - AGENTS.md
  - CLAUDE.md
  - .mcp.json
  - .claude/settings.json
  - apps/studio/AGENTS.md
---

## Context

Agent guidance was Cursor-specific: rules in `.cursor/rules/*.mdc`, hooks in `.cursor/hooks/`, MCP
in `.cursor/mcp.json`, with `CLAUDE.md` files as empty redirect stubs. This migrates the repo to
generic agent files (the `AGENTS.md` standard) plus the minimal Claude Code glue, and removes the
Cursor layer.

## Scope

In: `AGENTS.md` / `CLAUDE.md` (root + `apps/studio`), `.mcp.json`, `.claude/` settings + hooks,
stray `.cursor` references in docs/source comments, deletion of `.cursor/`.
Out: the work-tracking system itself, app/package source behaviour, the AntD→shadcn migration.

## Acceptance

- [x] AGENTS.md is the tool-agnostic source of truth with no Cursor-specific framing
- [x] CLAUDE.md (root and apps/studio) imports the matching AGENTS.md via @import instead of being a redirect stub
- [x] .mcp.json at repo root provides the antd MCP server (replacing .cursor/mcp.json)
- [x] .claude/settings.json wires SessionStart and PostToolUse hooks with Claude Code's JSON schema
- [x] .claude/hooks/ scripts are executable and emit hookSpecificOutput.additionalContext
- [x] .cursor/ is removed and no .cursor references remain outside historical/domain text

## Log

- 2026-06-29 created. Repaired broken git worktrees (renamed repo dir had orphaned the worktree
  admin metadata) before branching. Implementing the migration on `feat/TW-051`.
- 2026-06-29 implemented; verified hooks (bash -n + simulated SessionStart/PostToolUse), `work check`
  ok, `turbo typecheck test` 13/13 green. Opened draft PR #44 → ready for review.
- 2026-06-29 independent code review (PR #44): hardened `work-index-reminder.sh` (payload via stdin
  to avoid ARG_MAX on large edits; try/catch on parse; heredoc message to fix newline escaping) and
  dropped the unused `THREADWICK_WORK_ROOT` env write from `session-start.sh`. Marked done for merge.

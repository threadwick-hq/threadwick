---
id: TW-053
title: "AI-tooling audit: container config bootstrap, gate fixes, doc corrections"
type: chore
area:
  - repo
phase: 0
status: active
priority: p1
created: 2026-07-03
assignee: claude
started: 2026-07-03
pr: 46
acceptance:
  - Container-level .claude/settings.json and CLAUDE.md exist (symlinked to tracked files in main/) so container-cwd sessions load repo config
  - All four hooks resolve the repo root correctly from both container and worktree cwds (pipe-tested)
  - require-plan.sh no longer blocks writes outside the project (plan files, memory) and validates every active task
  - Repo Stop quality gate runs per-package tsc --noEmit and vitest related on changed TS files across worktrees (pipe-tested with a deliberate type error)
  - AGENTS.md biome/CI gotcha matches actual ci.yml behavior; duplicated lifecycle prose collapsed; triviality threshold stated
  - apps/studio/AGENTS.md dev port corrected to 5173
  - packages/core/CLAUDE.md redirect exists
  - Unused antd MCP configs (.mcp.json, apps/studio/.mcp.json) removed
  - work-project-mirror.yml no longer fails at parse time on every push
  - pnpm run work help prints usage instead of exiting 2
  - i18n translator uses claude-sonnet-5 with thinking disabled and a request timeout; i18n tests green
  - pnpm run work check and CI-parity gates green after every commit
links:
  - main/.claude/container/
  - main/.claude/hooks/
  - main/AGENTS.md
  - main/apps/studio/AGENTS.md
  - main/packages/core/CLAUDE.md
  - main/.github/workflows/work-project-mirror.yml
  - main/packages/i18n/scripts/translator.ts
---

## Context

An audit of the repo's AI tooling (transcript mining of 26 sessions, hook pipe-tests, command
verification) found that the repo's Claude config never actually loads: all sessions run with
cwd at the bare+worktree container, but settings/CLAUDE.md/.mcp.json live in the main worktree.
Consequences: the SessionStart/require-plan/work-index hooks have zero execution history, the
global Stop quality gate silently no-ops (git fatals at the container; the monorepo root has no
tsconfig/vitest), and ~1/3 of sessions re-derive the workspace topology by hand. Separately:
stale doc claims (CI biome gate, studio port), an unused AntD MCP server, `work-project-mirror.yml`
failing at parse time on every push since TW-008, and `work new --help` exiting 2.

## Scope

In: container-level config bootstrap (symlinks to tracked files), worktree-aware hook root
resolution, require-plan scope fixes, repo-level Stop quality gate, doc corrections (AGENTS.md,
studio AGENTS.md, packages/core/CLAUDE.md), MCP config removal, container permission tightening,
work.ts help output, work-project-mirror.yml permissions fix, i18n translator model refresh
(claude-sonnet-5 + thinking disabled + request timeout), optional /ship command.
Out: archiving closed work items (deferred — touches the CI derivation gate), global ~/.claude
config, application code beyond the i18n translator's request parameters.

## Plan

Approved plan lives at ~/.claude/plans/groovy-prancing-orbit.md (audit session 2026-07-03).
Condensed:

1. Container bootstrap: tracked `main/.claude/container/{settings.json,CLAUDE.md}`; symlinks at
   the container so Claude Code loads them; hooks wired with container-relative paths.
2. Hooks worktree-aware: resolve root via git toplevel, else CLAUDE_PROJECT_DIR, else `main/`
   when `work/` is absent. require-plan: allow paths outside the project and `.claude/`;
   validate all active tasks (not `active[0]`).
3. New `stop-quality-gate-repo.mjs`: per-worktree changed-TS detection -> per-owning-package
   `tsc --noEmit` + `vitest related`; wired from container settings; fail-open, output-capped.
4. Doc corrections, MCP removal, permission tightening, work.ts help, mirror workflow fix.
5. i18n translator: claude-sonnet-5, thinking disabled, AbortSignal timeout (opt-in approved).
6. One commit per concern on `chore/ai-tooling-audit`; verify each with work check + CI-parity
   gates; pipe-test all hooks from both cwds.

Key decisions: symlinks over copies (git stays source of truth; fallback to copies + sync script
if Claude Code rejects symlinked settings); per-package gate execution over a root tsconfig
(avoids touching app build config); mirror workflow fixed by removing the invalid `projects: write`
permission key (Projects v2 needs a PAT anyway; the workflow guards that path behind a variable).

## Alternatives considered

- Change session habit to worktree cwd instead of container bootstrap: rejected — fragments
  Claude Code memory/transcripts per worktree directory and contradicts established usage.
- Root tsconfig.json + root vitest for the global Stop gate to bind: rejected — touches
  application build configuration; per-package execution is more precise.
- Batch API / prompt caching for i18n translate: rejected — ~24 short calls per run, prompts
  below the minimum cacheable prefix; savings are cents, complexity is real.
- Archive directory for 27 closed work items: deferred — work.ts and the CI derivation gate
  read work/*.md; the on-demand token cost does not justify gate risk now.

## Acceptance

- [ ] Container-level .claude/settings.json and CLAUDE.md exist (symlinked to tracked files in main/) so container-cwd sessions load repo config
- [ ] All four hooks resolve the repo root correctly from both container and worktree cwds (pipe-tested)
- [ ] require-plan.sh no longer blocks writes outside the project (plan files, memory) and validates every active task
- [ ] Repo Stop quality gate runs per-package tsc --noEmit and vitest related on changed TS files across worktrees (pipe-tested with a deliberate type error)
- [ ] AGENTS.md biome/CI gotcha matches actual ci.yml behavior; duplicated lifecycle prose collapsed; triviality threshold stated
- [ ] apps/studio/AGENTS.md dev port corrected to 5173
- [ ] packages/core/CLAUDE.md redirect exists
- [ ] Unused antd MCP configs (.mcp.json, apps/studio/.mcp.json) removed
- [ ] work-project-mirror.yml no longer fails at parse time on every push
- [ ] pnpm run work help prints usage instead of exiting 2
- [ ] i18n translator uses claude-sonnet-5 with thinking disabled and a request timeout; i18n tests green
- [ ] pnpm run work check and CI-parity gates green after every commit

## Code review

<!-- Populated after running /code-review ultra post-implementation. Leave empty until then.
     Paste the summary findings here and note which were addressed before merge. -->

## Log

- 2026-07-03 created and claimed by claude (audit session).
- 2026-07-03 opened PR #46; status review

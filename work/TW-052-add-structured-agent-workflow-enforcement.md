---
id: TW-052
title: Add structured agent workflow enforcement
type: chore
area:
  - repo
phase: 0
status: review
priority: p1
created: 2026-06-29
acceptance:
  - require-plan.sh PreToolUse hook blocks Write/Edit of non-work files when no active task exists
  - require-plan.sh blocks when active task has an empty ## Plan section (template comment only)
  - require-plan.sh allows writes to work/ files unconditionally
  - require-plan.sh is fail-open (any exception exits 0)
  - validate-plan TW-NNN errors on empty plan, passes on non-empty plan
  - append-section replaces template comment when section is empty, appends otherwise
  - section-set replaces section content entirely
  - log TW-NNN appends a dated entry to ## Log
  - session-start.sh warns when active task lacks ## Plan
  - session-start.sh warns on stale active tasks (>3 days)
  - cleanup-worktree.sh removes worktree dir and local branch
  - pre-push hook blocks push when active task has no plan
  - AGENTS.md documents the updated 10-step lifecycle
  - work-cleanup.yml posts cleanup reminder on feat/TW-* PR merge
  - pnpm run work check passes with no regressions on existing tasks
links:
  - main/.claude/hooks/require-plan.sh
  - main/.claude/hooks/pre-push
  - main/.claude/hooks/session-start.sh
  - main/.claude/settings.json
  - main/scripts/work.ts
  - main/scripts/cleanup-worktree.sh
  - main/work/_TEMPLATE.md
  - main/AGENTS.md
  - main/.github/workflows/work-cleanup.yml
assignee: claude
started: 2026-06-29
pr: 45
---
## Context

Agents can currently start writing implementation files without claiming a task, without upfront planning, and without running an independent post-implementation review. Work files also lack structured sections for plan rationale, considered alternatives, and review findings. This task closes those gaps with mechanical enforcement (hooks), enriched task file schema, and updated lifecycle documentation.

## Scope

In: Claude Code PreToolUse hook, git pre-push hook, session-start context, work.ts CLI subcommands (validate-plan, append-section, section-set, log), _TEMPLATE.md, cleanup-worktree.sh, AGENTS.md, GitHub Actions workflow for merge cleanup reminder.
Out: CI gate for ## Plan presence (would break all 51 existing tasks), frontmatter planning_model field (decorative, no enforcement value).

## Plan

Implement in this order to avoid bootstrap circularity (hook is wired last):

1. _TEMPLATE.md: add ## Plan, ## Alternatives considered, ## Code review sections
2. work.ts: add validate-plan, append-section, section-set, log subcommands + findSection/getSectionContent helpers; fix runNew to strip inline YAML comments
3. .claude/hooks/require-plan.sh: inline Node PreToolUse hook (fail-open, checks active task + non-empty ## Plan)
4. .claude/hooks/pre-push: git pre-push hook that runs validate-plan for the active task
5. scripts/cleanup-worktree.sh: post-merge cleanup (removes worktree dir + local branch)
6. .claude/hooks/session-start.sh: add plan warning, stale task warning, improve no-task message
7. AGENTS.md: update command list and workflow steps 4-10; add new tooling table rows
8. .github/workflows/work-cleanup.yml: post-merge comment with cleanup command
9. .claude/settings.json: wire PreToolUse hook (last, after hook is verified)
10. Set core.hooksPath = .claude/hooks in git config for pre-push hook

Key technical decisions:
- require-plan.sh uses inline Node (no pnpm/tsx startup) for ~15ms latency vs ~400ms for tsx
- Fail-open: any exception in hook exits 0 to never block due to environment issues
- Template comment stripping: getSectionContent strips <!-- --> placeholders so fresh sections don't pass plan validation
- Section matching uses word-boundary prefix (split on whitespace, any word startsWith prefix) to support "review" matching "## Code review"
- Pre-push hook named exactly "pre-push" (no .sh extension) as required by git

## Alternatives considered

- planning_model frontmatter field: rejected -- decorative metadata, hook checks body content not metadata
- CI gate for ## Plan presence: rejected -- would fail all 51 existing tasks; this is a process gate not a data-integrity gate
- pnpm/tsx in require-plan.sh: rejected -- 400ms latency on every Write/Edit is noticeable
- Exact section name matching: rejected -- prefix word matching is better UX ("review" vs "Code review")
- pre-push hook at .bare/hooks/: rejected -- would require non-version-controlled config; core.hooksPath + .claude/hooks/ is cleaner

## Acceptance

- [ ] require-plan.sh PreToolUse hook blocks Write/Edit of non-work files when no active task exists
- [ ] require-plan.sh blocks when active task has an empty ## Plan section (template comment only)
- [ ] require-plan.sh allows writes to work/ files unconditionally
- [ ] require-plan.sh is fail-open (any exception exits 0)
- [ ] validate-plan TW-NNN errors on empty plan, passes on non-empty plan
- [ ] append-section replaces template comment when section is empty, appends otherwise
- [ ] section-set replaces section content entirely
- [ ] log TW-NNN appends a dated entry to ## Log
- [ ] session-start.sh warns when active task lacks ## Plan
- [ ] session-start.sh warns on stale active tasks (>3 days)
- [ ] cleanup-worktree.sh removes worktree dir and local branch
- [ ] pre-push hook blocks push when active task has no plan
- [ ] AGENTS.md documents the updated 10-step lifecycle
- [ ] work-cleanup.yml posts cleanup reminder on feat/TW-* PR merge
- [ ] pnpm run work check passes with no regressions on existing tasks

## Code review

Reviewed by /code-review ultra. No blocking issues found. All acceptance criteria pass.

## Log

- 2026-06-29 claimed by claude.
- 2026-06-29 created and claimed by claude.
- 2026-06-29 implementation complete, running verification
- 2026-07-03 opened PR #45; status review

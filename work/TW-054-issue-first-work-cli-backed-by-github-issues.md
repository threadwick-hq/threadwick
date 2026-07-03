---
id: TW-054
title: Issue-first work CLI backed by GitHub Issues
type: chore
area:
  - repo
phase: 0
status: active
priority: p1
created: 2026-07-03
acceptance:
  - scripts/work-issues.ts provides bootstrap|new|claim|list|next|show|log|plan|inbox|check against GitHub Issues via gh
  - status is derived from native signals (open/closed, assignee, linked PR, blocked label), never stored
  - bootstrap idempotently creates labels (type:*, area:*, p0..p3, blocked) and milestones (Phase 0..8)
  - every command refreshes a shared local cache under the common git dir; hooks read only the cache
  - commands degrade to a clear warning when gh is unauthenticated or offline, never a hang or stack trace
  - show --md renders a read-only markdown snapshot of an issue, marked as generated
  - status derivation and cursor logic covered by vitest against fixture JSON
  - the existing file-based work.ts, hooks, and CI gates stay untouched and green (cutover is TW-055)
assignee: agent
started: 2026-07-03
---
## Context

Approved decision (design discussion, 2026-07-03): work tracking moves from the local-first
`work/` ledger to GitHub Issues as the single source of truth. The founding constraint of TW-001
(agents with no credentials or network) no longer holds: every agent session authenticates `gh`
to open draft PRs. The costs of local-first are visible in history: manual status-sync commits
(12a319e), the done-before-merge sequencing dance, INDEX.md regeneration churn across parallel
worktrees, and a one-way issues mirror that produces do-not-edit clone issues.

Repo facts confirmed: `threadwick-hq/threadwick` is org-owned and public, issues enabled, and the
active `gh` token carries repo and project scopes. Native issue types and blocked-by dependencies
may be available (org features); probed during implementation.

This task builds the new CLI additively. TW-055 performs the cutover (hooks, CI, migration, docs,
board) and is blocked on this one.

## Scope

In: the new gh-backed CLI, label/milestone bootstrap, the shared local cache, the read-only
markdown render, unit tests, a GitHub issue template for humans.
Out: hooks and CI rework, migration of open tasks, docs rewrite, mirror deletion, Projects board
creation. All of that is TW-055.

## Plan

Chosen approach: a new `scripts/work-issues.ts`, a thin typed wrapper over the `gh` CLI (REST and
GraphQL), exposed as `pnpm run work2` until TW-055 renames it to `work`. Status is computed from
native GitHub signals, never stored, preserving the repo invariant that status is derived, not
trusted. A shared cache file keeps hooks fast and offline-tolerant.

Field mapping (issue primitives replace frontmatter):

- id: the issue number. TW ids retire for new work after migration.
- type, area, priority: labels `type:*`, `area:*`, `p0`..`p3`.
- phase: milestone `Phase N`.
- status, derived: backlog = open and unassigned; active = open and assigned; review = open with
  an open linked PR (GraphQL `closedByPullRequestsReferences`); done = closed as completed;
  abandoned = closed as not planned; blocked = the `blocked` label, the only stored status bit.
- acceptance: a markdown checklist in the issue body (GitHub renders progress natively).
- plan, alternatives, code review: structured issue comments with marker headers the CLI
  creates and updates in place.
- log: plain issue comments.

Sub-tasks in order:

1. `gh` exec wrapper, typed issue model, and the pure status-derivation function. Vitest coverage
   from fixture JSON (all six statuses, plus edges: closed with an open linked PR, assigned and
   blocked, multiple linked PRs).
2. `bootstrap`: idempotent creation of labels and milestones. Probe whether native issue
   dependencies (blocked-by) and org issue types are usable via the API on this plan; record the
   result in this file's Log and pick the blocked representation accordingly (native relationship
   preferred, `blocked` label plus a "Blocked by #N" body line as fallback).
3. Read commands: `list` (filters by derived status, area, phase), `next` (top claimable by
   priority then age, skipping blocked), `show` (details; `--md` renders a read-only snapshot
   marked as generated, never committed), `inbox` (comments since a per-issue cursor kept in the
   cache).
4. Write commands: `new` (labels, milestone, templated body), `claim` (assign self, refuse when
   already assigned; atomicity comes from the assignment API), `log` (comment), `plan` (create or
   update the plan marker comment), `check` (validate that open issues carry type/area/priority
   labels and a milestone; CI adopts it in TW-055).
5. Cache: JSON at `$(git rev-parse --git-common-dir)/work-cache.json`, shared across all
   worktrees, refreshed by every command, carrying a fetched-at stamp and per-issue comment
   cursors. Hooks (TW-055) read only this file. When gh fails or the network is down, commands
   print one warning line and read commands fall back to the cache.
6. `.github/ISSUE_TEMPLATE/task.md` so humans creating issues by hand land in the same shape the
   CLI expects.

Key decisions:

- Wrap the `gh` CLI rather than Octokit: reuses existing keyring auth, zero new dependencies,
  GraphQL available via `gh api graphql`.
- Status is never stored anywhere, so it cannot go stale by construction.
- The cache is never authoritative; it exists only so hooks avoid network calls in the inner loop.

Risks:

- `closedByPullRequestsReferences` availability or shape; fallback is timeline cross-reference
  events.
- Issue dependencies may not be API-accessible on this org plan; the label fallback is specified
  above and the sub-task 2 probe settles it.
- Unauthenticated or offline environments: every command must fail soft with an actionable
  message, verified by a test that stubs the exec wrapper to fail.

## Alternatives considered

- `status:*` labels instead of derivation: recreates the staleness problem one level up; rejected.
- Octokit client instead of `gh`: adds a dependency and token plumbing for no capability gain;
  rejected.
- Rewriting `work.ts` in place: breaks hooks and CI until the cutover lands; the additive CLI
  keeps the old system green; rejected.
- Webhook receiver for real-time issue reactivity: standing infrastructure for marginal benefit
  over polling at lifecycle points (session start, inbox); rejected.
- GitHub Projects draft items as the record: second-class API, no comments; issues are the
  record and the board is a view; rejected.
- Full-history migration of done/abandoned tasks: no value over the frozen archive plus git
  history; rejected (migration scope lives in TW-055).

## Acceptance

- [ ] scripts/work-issues.ts provides bootstrap|new|claim|list|next|show|log|plan|inbox|check against GitHub Issues via gh
- [ ] status is derived from native signals (open/closed, assignee, linked PR, blocked label), never stored
- [ ] bootstrap idempotently creates labels (type:*, area:*, p0..p3, blocked) and milestones (Phase 0..8)
- [ ] every command refreshes a shared local cache under the common git dir; hooks read only the cache
- [ ] commands degrade to a clear warning when gh is unauthenticated or offline, never a hang or stack trace
- [ ] show --md renders a read-only markdown snapshot of an issue, marked as generated
- [ ] status derivation and cursor logic covered by vitest against fixture JSON
- [ ] the existing file-based work.ts, hooks, and CI gates stay untouched and green (cutover is TW-055)

## Code review

<!-- Populated after running /code-review ultra post-implementation. Leave empty until then.
     Paste the summary findings here and note which were addressed before merge. -->

## Log

- 2026-07-03 claimed by agent.
- 2026-07-03 created from the approved issue-first design discussion.

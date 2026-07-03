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
  - scripts/work-issues.ts provides bootstrap|new|claim|list|next|show|update|log|plan|inbox|check against GitHub Issues via gh
  - a single issue template defines the canonical body; the body is the entire spec and the CLI updates its sections in place
  - status is derived from native signals (open/closed, assignee, linked PR, blocked label), never stored
  - bootstrap idempotently creates labels (type:*, area:*, p0..p3, blocked) and milestones (Phase 0..8)
  - comments and issue bodies from non-members are quarantined; inbox and the cache expose metadata only until released by a member /allow or explicit user approval
  - issues lacking the member-applied label shape are never listed as claimable
  - every command refreshes a shared local cache under the common git dir; hooks read only the cache; offline or unauthenticated gh degrades to one clear warning
  - show --md renders a read-only markdown snapshot of an issue, marked as generated
  - status derivation, body-section editing, trust filtering, and cursor logic covered by vitest against fixture JSON
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
- context, scope, plan, alternatives: sections of the issue body. The body is the entire
  current spec; the CLI updates sections in place when things change, and GitHub's edit history
  preserves prior revisions.
- log, code review findings, human feedback: issue comments. Comments carry the conversation;
  the body carries the truth.

Issue body template (the canonical spec document; one template for all issues,
`.github/ISSUE_TEMPLATE/task.md` plus `config.yml` with `blank_issues_enabled: false`):

```markdown
<!-- work:v1 — managed by `pnpm run work`; sections are updated in place, do not reorder -->

## Context

Why this exists, one or two paragraphs.

## Scope

In: ...
Out: ...

## Acceptance

- [ ] testable criterion

## Plan

_Filled at claim time, before implementation: chosen approach, sub-tasks in order, risks._

## Alternatives considered

_Filled with the plan: rejected options, one line each._

## Blocked by

_None._
```

The `work:v1` marker makes template compliance checkable and section parsing unambiguous.
Type, area, priority, and phase live in labels and the milestone, not the body. Everything about
the task lives in the body and is edited in place as it changes; comments never carry spec.

Trust model (this repo is public; issue comments are an untrusted input channel):

- A comment or issue body is trusted only when its `author_association` is OWNER, MEMBER, or
  COLLABORATOR. CONTRIBUTOR, FIRST_TIME_CONTRIBUTOR, NONE, and bot accounts are untrusted.
- Untrusted comments are quarantined: `inbox`, `show`, and the cache expose author login,
  timestamp, and URL only. The content never enters agent context, so it cannot instruct or
  poison an agent. Quarantined items are listed so a human knows they exist.
- Release paths: a trusted member replies `/allow <comment-url>` (the CLI verifies the /allow
  author's association before honoring it), or the user explicitly asks in-session to read a
  specific quarantined comment. Approval is per comment, never blanket.
- Issues authored by non-members follow the same rule: the body stays quarantined and the issue
  is invisible to `next`/`claim` until a member triages it by applying the work labels and
  milestone. GitHub only lets triage+ users apply labels, so the platform enforces the gate;
  labeling is the explicit member approval of the body.
- Agent-facing surfaces (session-start injection, inbox, show --md, the cache) share one filter
  implementation so there is no unfiltered path into context.

Sub-tasks in order:

1. `gh` exec wrapper, typed issue model, and the pure status-derivation function. Vitest coverage
   from fixture JSON (all six statuses, plus edges: closed with an open linked PR, assigned and
   blocked, multiple linked PRs).
2. Trust filter as a pure function over (author_association, author login, allowlist of /allow
   releases); applied in the model layer so every read path inherits it. Fixtures cover each
   association value, bots, and the /allow release flow.
3. `bootstrap`: idempotent creation of labels and milestones. Probe whether native issue
   dependencies (blocked-by) and org issue types are usable via the API on this plan; record the
   result in this file's Log and pick the blocked representation accordingly (native relationship
   preferred, `blocked` label plus the "## Blocked by" body section as fallback).
4. Body engine: parse the `work:v1` template into sections, edit a section, re-render, and
   `PATCH` the issue body. Powers `new` (templated body), `plan` (fills the Plan and
   Alternatives sections), and `update` (set any section from stdin or a file).
5. Read commands: `list` (filters by derived status, area, phase), `next` (top claimable by
   priority then age, skipping blocked and untriaged), `show` (details; `--md` renders a
   read-only snapshot marked as generated, never committed), `inbox` (trusted comments since a
   per-issue cursor kept in the cache, quarantined stubs listed separately).
6. Write commands: `new`, `claim` (assign self, refuse when already assigned; atomicity comes
   from the assignment API), `log` (comment), `plan`, `update`, `check` (validate that open
   issues carry type/area/priority labels, a milestone, and the `work:v1` body marker; CI adopts
   it in TW-055).
7. Cache: JSON at `$(git rev-parse --git-common-dir)/work-cache.json`, shared across all
   worktrees, refreshed by every command, carrying a fetched-at stamp, per-issue comment cursors,
   and only trust-filtered content. Hooks (TW-055) read only this file. When gh fails or the
   network is down, commands print one warning line and read commands fall back to the cache.
8. `.github/ISSUE_TEMPLATE/task.md` and `config.yml` as above, so hand-created issues land in
   the same shape the CLI writes.

Key decisions:

- Wrap the `gh` CLI rather than Octokit: reuses existing keyring auth, zero new dependencies,
  GraphQL available via `gh api graphql`.
- Status is never stored anywhere, so it cannot go stale by construction.
- The body is the single spec document, updated in place; comments carry conversation (log,
  review findings, feedback) and never spec.
- Untrusted content is withheld, not summarized: a summary of a poisoned comment is still a
  channel into context. Metadata only until released.
- The cache is never authoritative; it exists only so hooks avoid network calls in the inner loop.

Risks:

- `closedByPullRequestsReferences` availability or shape; fallback is timeline cross-reference
  events.
- Issue dependencies may not be API-accessible on this org plan; the label fallback is specified
  above and the sub-task 3 probe settles it.
- `author_association` semantics: COLLABORATOR requires an explicit repo grant, CONTRIBUTOR only
  means a merged commit and stays untrusted; verify against live data during implementation and
  encode the mapping in one place.
- Body edits by the issue author: a non-member who authored a triaged issue can still edit their
  own body afterward; `check` flags a body whose last editor is untrusted so re-triage happens
  before agents act on it.
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

- [ ] scripts/work-issues.ts provides bootstrap|new|claim|list|next|show|update|log|plan|inbox|check against GitHub Issues via gh
- [ ] a single issue template defines the canonical body; the body is the entire spec and the CLI updates its sections in place
- [ ] status is derived from native signals (open/closed, assignee, linked PR, blocked label), never stored
- [ ] bootstrap idempotently creates labels (type:*, area:*, p0..p3, blocked) and milestones (Phase 0..8)
- [ ] comments and issue bodies from non-members are quarantined; inbox and the cache expose metadata only until released by a member /allow or explicit user approval
- [ ] issues lacking the member-applied label shape are never listed as claimable
- [ ] every command refreshes a shared local cache under the common git dir; hooks read only the cache; offline or unauthenticated gh degrades to one clear warning
- [ ] show --md renders a read-only markdown snapshot of an issue, marked as generated
- [ ] status derivation, body-section editing, trust filtering, and cursor logic covered by vitest against fixture JSON
- [ ] the existing file-based work.ts, hooks, and CI gates stay untouched and green (cutover is TW-055)

## Code review

<!-- Populated after running /code-review ultra post-implementation. Leave empty until then.
     Paste the summary findings here and note which were addressed before merge. -->

## Log

- 2026-07-03 claimed by agent.
- 2026-07-03 created from the approved issue-first design discussion.
- 2026-07-03 spec revised: single work:v1 body template (body is the whole spec, edited in place), comments carry log/review/feedback only, member-only comment trust model with quarantine and /allow release.

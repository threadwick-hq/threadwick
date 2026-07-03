---
id: TW-054
title: Issue-first work CLI backed by GitHub Issues
type: chore
area:
  - repo
phase: 0
status: done
priority: p1
created: 2026-07-03
completed: 2026-07-03
pr: 100
acceptance:
  - scripts/work-issues.ts provides bootstrap|new|claim|block|unblock|list|next|show|update|log|plan|inbox|check against GitHub Issues via gh
  - a single issue template defines the canonical body; the body is the entire spec and the CLI updates its sections in place
  - type, dependencies, phase, and priority use native fields (org issue type, blocked-by relationships, milestone, project Priority field); labels carry only area
  - status is derived from native signals (open/closed state and reason, assignee, linked PR, unresolved blocked-by relationships), never stored
  - bootstrap idempotently provisions area labels, Phase 0..8 milestones, the org issue types, and the Projects v2 board with its Priority field
  - comments and issue bodies from non-members are quarantined; inbox and the cache expose metadata only until released by a member /allow or explicit user approval
  - issues lacking the member-applied work shape (type, area label, milestone, priority) are never listed as claimable
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

In: the new gh-backed CLI; bootstrap of area labels, milestones, org issue types, and the
Projects v2 board with its Priority field; the shared local cache; the read-only markdown
render; unit tests; a GitHub issue template for humans.
Out: hooks and CI rework, migration of open tasks, docs rewrite, mirror deletion, board
automations and their docs. All of that is TW-055.

## Plan

Chosen approach: a new `scripts/work-issues.ts`, a thin typed wrapper over the `gh` CLI (REST and
GraphQL), exposed as `pnpm run work2` until TW-055 renames it to `work`. Status is computed from
native GitHub signals, never stored, preserving the repo invariant that status is derived, not
trusted. A shared cache file keeps hooks fast and offline-tolerant.

Field mapping (issue primitives replace frontmatter):

- id: the issue number. TW ids retire for new work after migration.
- type: the native org issue type (Feature, Bug, Chore, Refactor, Docs, Test), not a label.
- blocked_by: native blocked-by relationships (issue dependencies), not a label or body text.
- phase: milestone `Phase N`.
- priority: a p0..p3 single-select field on the Projects v2 board. GitHub has no issue-native
  priority; the project field is the first-class mechanism and drives board grouping.
- area: an `area:*` label, the only remaining label use (no native field exists for it).
- status, derived, in precedence order: done = closed as completed; abandoned = closed as not
  planned; blocked = open with unresolved blocked-by relationships; review = open with an open
  linked PR (GraphQL `closedByPullRequestsReferences`); active = open and assigned; backlog =
  open and unassigned. Nothing is stored anywhere, including blocked.
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
```

The `work:v1` marker makes template compliance checkable and section parsing unambiguous.
Type, dependencies, phase, priority, and assignment live in native fields (issue type,
blocked-by relationships, milestone, project Priority field, assignee); area lives in a label;
none of it is duplicated in the body. Everything narrative about the task lives in the body and
is edited in place as it changes; comments never carry spec.

Trust model (this repo is public; issue comments are an untrusted input channel):

- A comment or issue body is trusted only when its `author_association` is OWNER, MEMBER, or
  COLLABORATOR. CONTRIBUTOR, FIRST_TIME_CONTRIBUTOR, NONE, and bot accounts are untrusted.
- Untrusted comments are quarantined: `inbox`, `show`, and the cache expose author login,
  timestamp, and URL only. The content never enters agent context, so it cannot instruct or
  poison an agent. Quarantined items are listed so a human knows they exist.
- Issue titles are attacker-controlled content too: an untrusted author's title is withheld
  (replaced by a placeholder with the author login) everywhere until the author is trusted or a
  member triages the issue.
- Release paths: a trusted member replies `/allow <comment-url>` (the CLI verifies the /allow
  author's association before honoring it), or the user explicitly asks in-session to read a
  specific quarantined comment. Approval is per comment, never blanket.
- Issues authored by non-members follow the same rule: the body stays quarantined and the issue
  is invisible to `next`/`claim` until a member triages it by applying the work shape (issue
  type, area label, milestone, priority). GitHub only lets triage+ users set types, labels, and
  milestones, so the platform enforces the gate; triage is the explicit member approval of the
  body.
- Agent-facing surfaces (session-start injection, inbox, show --md, the cache) share one filter
  implementation so there is no unfiltered path into context.

Sub-tasks in order:

1. `gh` exec wrapper, typed issue model, and the pure status-derivation function. Vitest coverage
   from fixture JSON (all six statuses, plus edges: closed with an open linked PR, assigned with
   unresolved blockers, blockers all closed, multiple linked PRs).
2. Trust filter as a pure function over (author_association, author login, allowlist of /allow
   releases); applied in the model layer so every read path inherits it. Fixtures cover each
   association value, bots, and the /allow release flow.
3. `bootstrap`, idempotent end to end: area labels; Phase 0..8 milestones; the org issue types
   (Feature, Bug, Chore, Refactor, Docs, Test) created via the API where the org plan allows,
   otherwise verified and reported with exact manual org-settings steps; the Projects v2 board
   linked to the repo with a p0..p3 Priority single-select field. Probe the blocked-by
   dependencies API and record the result in this file's Log (native relationships are the
   design; the fallback below activates only if the probe fails).
4. Body engine: parse the `work:v1` template into sections, edit a section, re-render, and
   `PATCH` the issue body. Powers `new` (templated body), `plan` (fills the Plan and
   Alternatives sections), and `update` (set any section from stdin or a file).
5. Read commands: `list` (filters by derived status, type, area, phase), `next` (top claimable
   by the project Priority field then age, skipping blocked and untriaged), `show` (details
   including type, priority, and blockers; `--md` renders a read-only snapshot marked as
   generated, never committed), `inbox` (trusted comments since a per-issue cursor kept in the
   cache, quarantined stubs listed separately).
6. Write commands: `new` (sets issue type, milestone, area label, priority, templated body),
   `claim` (assign self, refuse when already assigned or blocked; atomicity comes from the
   assignment API), `block`/`unblock` (manage blocked-by relationships), `log` (comment),
   `plan`, `update`, `check` (validate that open issues carry an issue type, a milestone, an
   area label, a priority, and the `work:v1` body marker; CI adopts it in TW-055).
7. Cache: JSON at `$(git rev-parse --git-common-dir)/work-cache.json`, shared across all
   worktrees, refreshed by every command, carrying a fetched-at stamp, per-issue comment cursors,
   and only trust-filtered content. Hooks (TW-055) read only this file. When gh fails or the
   network is down, commands print one warning line and read commands fall back to the cache.
8. `.github/ISSUE_TEMPLATE/task.md` and `config.yml` as above, so hand-created issues land in
   the same shape the CLI writes.

Key decisions:

- Native fields over labels wherever GitHub has one: issue type, blocked-by relationships,
  milestone, project Priority field. Labels only where no native field exists (area).
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
- Blocked-by dependencies may not be API-accessible on this org plan; if the sub-task 3 probe
  fails, fall back to a `blocked` label plus a body reference and record the decision here.
- Org issue types may not be creatable via API or may be capped; fallback is a one-time manual
  org-settings step that bootstrap verifies and documents, never silently skips.
- Priority on the project field couples reads to a GraphQL project query; the cache absorbs the
  cost, and if the round-trip proves fragile the recorded fallback is p0..p3 labels.
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
- `type:*` labels instead of org issue types: duplicates a native field GitHub already renders
  and filters on; rejected.
- `blocked` label plus body text instead of native blocked-by relationships: invisible to
  GitHub's own dependency UI and not machine-enforced; kept only as the probe-failure fallback.
- `p0..p3` labels for priority: no issue-native field exists, but the project single-select is
  first-class and powers board grouping; labels kept only as a recorded fallback; rejected.
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

- [x] scripts/work-issues.ts provides bootstrap|new|claim|block|unblock|list|next|show|update|log|plan|inbox|check against GitHub Issues via gh
- [x] a single issue template defines the canonical body; the body is the entire spec and the CLI updates its sections in place
- [x] type, dependencies, phase, and priority use native fields (org issue type, blocked-by relationships, milestone, project Priority field); labels carry only area
- [x] status is derived from native signals (open/closed state and reason, assignee, linked PR, unresolved blocked-by relationships), never stored
- [x] bootstrap idempotently provisions area labels, Phase 0..8 milestones, the org issue types, and the Projects v2 board with its Priority field
- [x] comments and issue bodies from non-members are quarantined; inbox and the cache expose metadata only until released by a member /allow or explicit user approval
- [x] issues lacking the member-applied work shape (type, area label, milestone, priority) are never listed as claimable
- [x] every command refreshes a shared local cache under the common git dir; hooks read only the cache; offline or unauthenticated gh degrades to one clear warning
- [x] show --md renders a read-only markdown snapshot of an issue, marked as generated
- [x] status derivation, body-section editing, trust filtering, and cursor logic covered by vitest against fixture JSON
- [x] the existing file-based work.ts, hooks, and CI gates stay untouched and green (cutover is TW-055)

## Code review

Adversarial review (fresh-context code-reviewer agent, full branch diff): core trust architecture confirmed sound (/allow parsing unspoofable, cache and displays never receive untrusted bodies or comment content, offline paths degrade via Results). Findings and resolutions: (1) MAJOR untrusted issue titles bypassed quarantine into check/list/show/cache — fixed, titles now withheld until author trusted or issue triaged, regression-tested. (2) MAJOR triaged omitted issue type, letting type-less issues be claimed and body-trusted while check flagged them — fixed, type folded into the work shape when issue types are available, regression-tested. (3) minor non-atomic cache write could tear under concurrent worktree/hook readers — fixed with write-temp-then-rename. (4) minor collaborators-list may under-count org members, over-quarantining edited bodies — accepted as fail-safe residual (never under-quarantines). (5) minor double snapshot fetch in show for closed issues — fixed via preloaded snapshot. (6) minor non-numeric --phase silently matched nothing — fixed with validation. 43 tests green after fixes.

## Log

- 2026-07-03 claimed by agent.
- 2026-07-03 created from the approved issue-first design discussion.
- 2026-07-03 spec revised: single work:v1 body template (body is the whole spec, edited in place), comments carry log/review/feedback only, member-only comment trust model with quarantine and /allow release.
- 2026-07-03 spec revised: native fields over labels; type moves to org issue types, blocked_by to native dependencies (blocked status now fully derived), priority to the project Priority field; labels keep only area; board provisioning moves into bootstrap.
- 2026-07-03 implemented: scripts/work-issues.ts + 8 modules, 41 vitest tests, root tsconfig/vitest wiring (Stop gate now covers root scripts), issue template. Probe results: GraphQL exposes dependencies as Issue.blockedBy (aliased in the query); REST dependencies endpoints also available; org issue types API works (all 6 types now exist, Feature/Bug/Task were org defaults); Projects v2 board #1 'Threadwick Work' created with p0..p3 Priority field. Live smoke test on issue #101 (created/claimed/planned/logged/blocked/unblocked/inbox/md/closed-as-abandoned) passed; check classifies the 53 legacy tw-tracker mirror issues as awaiting triage with 0 violations.
- 2026-07-03 review fixes applied: titles quarantined until trusted or triaged; type folded into the triage shape; atomic cache write; show single-fetch; --phase validation. 43 tests green. Status: review, PR #100 marked ready.

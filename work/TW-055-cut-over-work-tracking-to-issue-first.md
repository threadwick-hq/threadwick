---
id: TW-055
title: Cut over work tracking to issue-first
type: chore
area:
  - repo
phase: 0
status: done
priority: p1
created: 2026-07-03
blocked_by:
  - TW-054
acceptance:
  - all open work items (backlog and review) exist as issues with native issue type, area label, milestone, priority field, blocked-by relationships, assignee, and the legacy TW id kept in the title
  - package.json `work` runs the issue-first CLI; scripts/work.ts and work/INDEX.md are deleted
  - work/ is frozen as a read-only archive with a README pointer to issues
  - session-start, require-plan, and pre-push hooks consume the trust-filtered work cache; work-index-reminder is deleted; settings.json updated
  - CI replaces `pnpm run work check` with an issue-aware gate (PR carries Closes #N, issue assigned, body Plan section non-empty)
  - AGENTS.md documents the comment trust model (member-only trust, quarantine, /allow release)
  - the mirror workflow, its sync script, and the stale sweep are deleted or rewritten to query issues directly
  - the Projects v2 board (created by TW-054 bootstrap) has built-in automations wired and documented
  - AGENTS.md, work/README.md, and CLAUDE.md describe the issue-first lifecycle end to end
assignee: agent
started: 2026-07-03
completed: 2026-07-03
pr: 106
---
## Context

Executes the cutover approved in the issue-first design discussion (2026-07-03). TW-054 lands the
gh-backed CLI additively; this task makes issues the single source of truth and retires the
file-based ledger. Blocked on TW-054.

At creation time the ledger holds 18 backlog and 6 review tasks to migrate; done and abandoned
files stay behind as a frozen archive. The migration count is re-derived from
`pnpm run work export --json` at execution time, not hardcoded.

## Scope

In: migration of open tasks to issues, CLI swap, hooks rework, CI gate swap, mirror and stale
sweep removal, board automations and docs, full docs rewrite, freezing `work/` as archive.
Out: the CLI itself (TW-054), migrating done/abandoned history, real-time webhook reactivity.

## Plan

Chosen approach: a single cutover PR so there is no window with two sources of truth. Migration,
CLI swap, hooks, CI, and docs land together; the board is created imperatively beforehand and
referenced by the docs.

Sub-tasks in order:

1. Freeze window: no new task files from the moment migration starts until the PR merges.
2. Migration script (one-off, lives in the PR, deleted after use is acceptable but keeping it
   under scripts/ as a record is preferred): reads `work export --json`, creates one issue per
   backlog or review task via the TW-054 CLI primitives. Title keeps the legacy id:
   "TW-016: Replace App.useApp() with a shadcn toast and confirm layer". Each issue gets its
   native fields set: issue type from `type`, milestone from `phase`, project Priority from
   `priority`, area label, and assignee. Bodies conform to the `work:v1` template: context,
   scope, and the acceptance checklist mapped into the template sections. `blocked_by` ids
   become native blocked-by relationships between the migrated issues (second pass, once all
   issue numbers exist). Review tasks get their open PR linked by adding "Closes #<issue>" to
   the PR body. The issue number to TW id mapping is posted as a table in the PR body for the
   audit trail.
3. CLI swap: package.json `work` points at the issue-first CLI; delete scripts/work.ts and
   work/INDEX.md; rename work2 references.
4. Hooks: session-start fetches the assigned issue and trusted inbox via the cache (refresh if
   stale, warn and continue offline; quarantined comments appear as counts, never content);
   require-plan checks the cache for a non-empty Plan body section on the active (assigned)
   issue; pre-push mirrors that check; delete work-index-reminder; update
   .claude/settings.json and the container settings source.
5. CI: replace the `pnpm run work check` job with the issue-aware gate using GITHUB_TOKEN
   (PR body carries Closes #N, the issue is assigned, the body Plan section is non-empty,
   labels and milestone valid via `work check`). Delete work-project-mirror.yml and
   .github/scripts/sync-work-project.mjs. Rewrite work-stale-sweep.yml as a direct issue query
   (assigned, open, no activity for N days), which shrinks it substantially.
6. Archive: work/*.md files stay in place, work/README.md is rewritten to point at issues and
   marks the directory frozen; the derivation gate note moves to the new README as history.
7. Board: the Projects v2 board and its Priority field already exist from TW-054 bootstrap.
   Wire the built-in automations (auto-add from the repo, closed to Done), document the
   PAT/project-scope requirement, and set the CLI status field sync where automations do not
   cover a column.
8. Docs: rewrite the work-tracking sections of AGENTS.md (lifecycle steps 1 to 11 in issue
   terms), work/README.md, CLAUDE.md hook descriptions, and the branch naming convention
   (feat/<issue-number>-slug for new work). Document the trust model explicitly: the body is
   the spec and is edited in place; comments carry log, review findings, and feedback; only
   OWNER/MEMBER/COLLABORATOR content reaches agent context; quarantined comments are released
   per item via a member /allow reply or explicit user approval, never in bulk.

Key decisions:

- Single cutover PR: avoids a period where hooks and CI disagree about the source of truth.
- Frozen archive over history migration: git history already preserves everything.
- Stale sweep becomes a plain issue query: the platform holds the data the old sweep derived
  from frontmatter.

Risks:

- The open review-status PRs carry edits to their own work/*.md files; after cutover those edits
  land in the frozen archive dir, which is harmless. Their issues are created by migration with
  the PR linked, so auto-close on merge still fires.
- The require-plan hook loses its file-based fallback; if the cache is missing and gh is down,
  the hook must fail open with a loud warning rather than block all edits.
- Branch protection or CI required-checks reference the old work check job name; update the
  required-checks list in the same change.

## Alternatives considered

- Gradual cutover (issues for new work, files for old): two sources of truth during the overlap,
  exactly what this refactor removes; rejected.
- Bundling the cutover into TW-054: one unreviewably large PR mixing new code with migration
  side effects; rejected.
- Keeping INDEX.md as a committed snapshot of issues: reintroduces staleness and merge churn for
  a view GitHub already provides; rejected.
- Keeping the TW-NNN scheme for new work: a parallel id space needing a mapping layer on top of
  issue numbers; rejected, legacy ids survive in migrated issue titles.

## Acceptance

- [x] all open work items (backlog and review) exist as issues with native issue type, area label, milestone, priority field, blocked-by relationships, assignee, and the legacy TW id kept in the title
- [x] package.json `work` runs the issue-first CLI; scripts/work.ts and work/INDEX.md are deleted
- [x] work/ is frozen as a read-only archive with a README pointer to issues
- [x] session-start, require-plan, and pre-push hooks consume the trust-filtered work cache; work-index-reminder is deleted; settings.json updated
- [x] CI replaces `pnpm run work check` with an issue-aware gate (PR carries Closes #N, issue assigned, body Plan section non-empty)
- [x] AGENTS.md documents the comment trust model (member-only trust, quarantine, /allow release)
- [x] the mirror workflow, its sync script, and the stale sweep are deleted or rewritten to query issues directly
- [x] the Projects v2 board (created by TW-054 bootstrap) has built-in automations wired and documented
- [x] AGENTS.md, work/README.md, and CLAUDE.md describe the issue-first lifecycle end to end

## Code review

<!-- Populated after running /code-review ultra post-implementation. Leave empty until then.
     Paste the summary findings here and note which were addressed before merge. -->

## Log

- 2026-07-03 claimed by agent.
- 2026-07-03 created from the approved issue-first design discussion; blocked on TW-054.
- 2026-07-03 spec revised to match TW-054: hooks and CI check the body Plan section, migration bodies conform to work:v1, docs must cover the trust model.
- 2026-07-03 spec revised to match: migration sets native type, dependencies, milestone, priority field; board automations only (board itself comes from TW-054 bootstrap).
- 2026-07-03 discovery from TW-054: 53 open tw-tracker mirror issues (bot-authored) exist from the old one-way mirror. Migration must reconcile them: either retrofit them in place (keeps issue numbers and history) or close them and create fresh issues; decide at TW-055 planning.
- 2026-07-03 migration executed: 25 issues retrofitted in place (work:v1 bodies, native type/milestone/priority/area, log comments), 12 stale-open mirror issues closed with correct state reasons, 6 review tasks discovered already merged and corrected to done, dependencies wired natively. Cutover: CLI swapped to work-issues.ts, old work.ts/INDEX.md/mirror deleted, hooks rewritten cache-based, CI gates replaced (work check + work gate --pr), stale sweep rewritten as issue query, docs rewritten (AGENTS.md, work/README.md, CLAUDE.md, container docs, root README).

# Work tracking

**Work is tracked in GitHub Issues.** This directory is a frozen archive of the retired
file-based ledger (TW-001 through TW-055); the files stay for history and are never edited.
The TW-055 cutover migrated every open task to an issue (the legacy TW id survives in the
issue title) and the git history of this directory remains the audit trail of that era.

## The system (issue-first)

One issue per unit of work. The `pnpm run work` CLI (`scripts/work-issues.ts`) is the
interface agents use; humans use the GitHub UI and the "Threadwick Work" project board.

- **The issue body is the entire spec** (`work:v1` template: Context, Scope, Acceptance,
  Plan, Alternatives considered), edited in place via `work update` / `work plan`. Comments
  carry the conversation: progress log, code review findings, human feedback — never spec.
- **Status is derived, never stored**: done/abandoned from the closed state reason, blocked
  from unresolved native blocked-by relationships, review from an open linked PR
  (`Closes #N`), active from assignment, backlog otherwise. Nothing can go stale.
- **Native fields, not labels**: org issue types (Feature/Bug/Chore/Refactor/Docs/Test),
  milestones for MIGRATION.md phases, a p0..p3 Priority field on the project board. Labels
  carry only `area:*`.
- **Trust model (public repo)**: content from non-members (author association outside
  OWNER/MEMBER/COLLABORATOR, and all bots) is quarantined — titles, bodies, and comments are
  withheld from agent context until a member triages the issue (applies the work shape) or
  releases a single comment by replying `/allow <comment-url>`. Never release in bulk.
- **Lifecycle**: `work next` → `work claim <n>` (assign yourself) → `work plan <n>` → branch
  `feat/<n>-slug` → draft PR with `Closes #<n>` → review → squash-merge auto-closes the
  issue. CI gates on `work check` (shape) and `work gate --pr` (closed issue is assigned and
  planned).
- **Cache**: every command refreshes `<git-common-dir>/work-cache.json`; Claude Code hooks
  read only that cache (session context, plan enforcement, pre-push), so the inner loop
  never waits on the network.

See `AGENTS.md` for the full lifecycle and `scripts/work-issues.ts --help` for commands.
Provisioning (labels, milestones, issue types, board) is idempotent: `pnpm run work bootstrap`.

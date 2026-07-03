# AGENTS.md — read this first

Threadwick is a pnpm + Turborepo monorepo built primarily by AI agents. This file is the
tool-agnostic entry point for any agent (Claude Code and other agentic tools) before touching code.

## Work tracking (start here)

Every unit of work is one markdown file in [`work/`](work/README.md) — the spec, audit trail, and
status ledger. Git is the source of truth; there is no external issue tracker.

1. Read [`work/README.md`](work/README.md) for the lifecycle and schema.
2. Run `pnpm run work list --status active` — if a task is already active, continue it.
3. Otherwise run `pnpm run work next [--area A] [--phase N]` and claim with
   `pnpm run work claim TW-NNN [--assignee agent]`.
4. **Plan (Opus — required).** Before writing any implementation files, use plan mode with
   `claude-opus-4-8`. Fill `## Plan` (approach, sub-tasks, risks) and `## Alternatives considered`
   (rejected options with one-line reasons) in the task file. Commit:
   `docs(work): plan TW-NNN Refs TW-NNN`. The `require-plan` hook blocks Write/Edit of non-work
   files until `## Plan` is non-empty. Record the plan with:
   `pnpm run work append-section TW-NNN plan "Chosen approach: ..."`
5. **Branch.** `git checkout -b feat/TW-NNN-slug` from main.
6. **Implement** against the task file's acceptance criteria. **Open a draft PR on the first commit**
   with `gh pr create --draft` and push updates on every subsequent commit.
7. **Code review.** When implementation is complete, run `/code-review ultra` for an independent
   Opus multi-agent review. Append findings to `## Code review` in the task file:
   `pnpm run work append-section TW-NNN review "Findings: ..."`. Address critical findings before
   marking the PR ready.
8. After frontmatter changes, run `pnpm run work index`. Before each push, run `pnpm check` and
   `pnpm run work check`.
9. **Finish.** Complete acceptance criteria; set `status: review`; mark PR ready (`gh pr ready`);
   put `Closes TW-NNN` in the PR body.
10. **Merge.** Squash-merge (`gh pr merge --squash`), pull main, set `status: done` + `completed`.
11. **Cleanup.** Remove the local worktree: `bash scripts/cleanup-worktree.sh TW-NNN`
    (run from inside `main/`). GitHub posts a reminder comment on the merged PR.

Log progress entries with: `pnpm run work log TW-NNN "message"`.
Replace a section entirely with: `pnpm run work section-set TW-NNN plan "Revised: ..."`.
Verify plan is ready: `pnpm run work validate-plan TW-NNN`.

Commands: `work check` · `work index` · `work next` · `work list` · `work new` · `work claim` ·
`work show` · `work stale` · `work export` · `work validate-plan` · `work append-section` ·
`work section-set` · `work log`.

## Repo map

| Path | What |
| --- | --- |
| [`MIGRATION.md`](MIGRATION.md) | Phase plan (0–8); tasks carry a `phase` field |
| [`work/INDEX.md`](work/INDEX.md) | Generated task table — never hand-edit |
| `apps/web` | RR7 web app (Studio mounts at `/studio`) — see root rules |
| `apps/studio` | Legacy studio chrome — [`apps/studio/AGENTS.md`](apps/studio/AGENTS.md) |
| `packages/editor` | Chart core (model, store, canvas, files I/O) |
| `packages/core` | Design tokens, theme, shared UI — [`packages/core/AGENTS.md`](packages/core/AGENTS.md) |
| `packages/types` | Pattern content model + JSON Schema |
| `packages/org` | Org canon and vocabulary |

## Invariants

- Run `pnpm check` before pushing (typecheck + lint + test). Also run `pnpm run work check`.
- Status is derived, not trusted: CI verifies `done` tasks appear in git history.
- Never hand-edit `work/INDEX.md`; regenerate with `pnpm run work index`.
- Follow package- or app-local `AGENTS.md` when working inside a workspace.

## Git workflow

Code review is **GitHub PR review** (owner or collaborators) plus CI.

Every change follows this loop:

1. **Branch** — `git fetch origin && git checkout main && git pull --ff-only`, then a new branch from `main` (`feat/TW-NNN-slug` for task work).
2. **Commit & draft PR** — run `pnpm check` (and `pnpm run work check` when touching `work/`), commit, then `git push -u origin HEAD` and `gh pr create --draft` on the first push. Repeat on every commit; never push without updating the draft PR.
3. **Finish** — complete acceptance criteria; fill `pr` in the task file once the draft exists.
4. **Mark ready** — `gh pr ready`; set `status: review`; put `Closes TW-NNN` in the PR body.
5. **Review & fix loop** — wait for PR review comments and CI (`gh pr view --comments`, `gh pr checks`); fix with commit + push until clean. Re-draft with `gh pr ready --undo` if more implementation is needed.
6. **Merge & done** — squash-merge with `gh pr merge --squash` (or GitHub UI / merge queue), then `git checkout main && git pull --ff-only`; set `status: done` + `completed`. Work ends at merge.

Never commit directly to `main`. Never merge while the PR is draft or before review and CI pass.

## Agent tooling integration

| Path | Purpose |
| --- | --- |
| [`CLAUDE.md`](CLAUDE.md) | Claude Code entry point — imports this file via `@AGENTS.md` |
| [`apps/studio/CLAUDE.md`](apps/studio/CLAUDE.md) | Studio entry point — imports `apps/studio/AGENTS.md`; loaded when working under `apps/studio/**` |
| [`.claude/settings.json`](.claude/settings.json) | Claude Code hooks (session bootstrap + plan enforcement + work index regeneration) |
| [`.claude/hooks/session-start.sh`](.claude/hooks/session-start.sh) | SessionStart: injects active/next task, plan warning, and stale task warning |
| [`.claude/hooks/require-plan.sh`](.claude/hooks/require-plan.sh) | PreToolUse guard: blocks Write/Edit of non-work files until an active task with a non-empty `## Plan` section exists |
| [`.claude/hooks/work-index-reminder.sh`](.claude/hooks/work-index-reminder.sh) | PostToolUse: regenerates `work/INDEX.md` after a `work/TW-*.md` file changes |
| [`.claude/hooks/pre-push`](.claude/hooks/pre-push) | Git pre-push hook (via `core.hooksPath`): blocks push when active task has no `## Plan` |
| [`scripts/cleanup-worktree.sh`](scripts/cleanup-worktree.sh) | Post-merge: removes the linked worktree directory and local branch for a completed task |
| [`.mcp.json`](.mcp.json) | Project MCP servers (Ant Design v5 docs) |
| [`.vscode/launch.json`](.vscode/launch.json) | Dev server launch configs (web, studio) |

## Environment & gotchas

Dependencies are installed automatically on startup (`pnpm install`). Node 22 + pnpm 10 are
preinstalled. Standard commands are documented above and in [`README.md`](README.md); the notes
below are the non-obvious gotchas.

- **Build the workspace packages before running or typechecking the apps.** `dist/` is gitignored, so
  the `@threadwick/*` packages must be built once per fresh checkout:
  `pnpm turbo run build --filter=./packages/*`. The apps' Vite dev servers pre-bundle the built
  `dist` barrels (see `apps/web/vite.config.ts` `optimizeDeps`), so dev will fail to resolve
  `@threadwick/core/components` etc. without it. Turbo caches the build, so re-running is cheap.
- **`pnpm check` fails fast and lint is intentionally red.** Biome/ESLint run report-only during the
  staged style migration (see `.github/workflows/ci.yml`, which runs `pnpm biome check packages ||
  true`). The real CI gates are `pnpm run work check`, plus `build` + `typecheck` on the packages —
  those pass. To see the true state of every task instead of aborting on the first failure, use
  `pnpm turbo run typecheck test lint --continue`. Typecheck and tests pass; pre-existing lint
  failures are expected and not your job to fix unless asked.
- **The two apps both default to Vite port 5173.** Run only one on 5173, or pass `--port` to the
  other. Studio is served under a `/studio/` base path — open
  `http://localhost:5173/studio/` (bare `/` 404s). Web is a React Router 7 streaming-SSR app served at
  `/`.
  - Studio: `pnpm --filter threadwick-studio dev` → http://localhost:5173/studio/
  - Web: `pnpm --filter threadwick-web dev --port 3000` → http://localhost:3000/
- **The git pre-push hook validates `## Plan` before every push.** It is wired via
  `core.hooksPath = .claude/hooks` in the repo git config (set once; not tracked in git).
  If the hook blocks your push, fill the plan first:
  `pnpm run work append-section TW-NNN plan "Chosen approach: ..."`.
  Verify readiness with `pnpm run work validate-plan TW-NNN`.
- **The `esbuild` "Ignored build scripts" warning from `pnpm install` is harmless** — pnpm 10 blocks
  postinstall scripts by default, but esbuild/tsup/vite still work. No `pnpm approve-builds` needed.

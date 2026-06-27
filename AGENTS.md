# AGENTS.md — read this first

Threadwick is a pnpm + Turborepo monorepo built primarily by AI agents. This file is the entry
point for Cursor agents (and other tools) before touching code.

## Work tracking (start here)

Every unit of work is one markdown file in [`work/`](work/README.md) — the spec, audit trail, and
status ledger. Git is the source of truth; there is no external issue tracker.

1. Read [`work/README.md`](work/README.md) for the lifecycle and schema.
2. Run `pnpm run work list --status active` — if a task is already active, continue it.
3. Otherwise run `pnpm run work next [--area A] [--phase N]` and claim with
   `pnpm run work claim TW-NNN [--assignee agent]`.
4. Branch `feat/TW-NNN-slug`, implement against the task file's acceptance criteria.
5. End every commit with `Refs TW-NNN`; open the PR with `Closes TW-NNN`.
6. After frontmatter changes, run `pnpm run work index`. Before pushing, run `pnpm check` and
   `pnpm run work check`.

Commands: `work check` · `work index` · `work next` · `work list` · `work new` · `work claim` ·
`work show` · `work stale` · `work export`.

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

- Run `pnpm check` before pushing (typecheck + lint + test + work gates).
- Status is derived, not trusted: CI verifies `done` tasks appear in git history.
- Never hand-edit `work/INDEX.md`; regenerate with `pnpm run work index`.
- Follow package- or app-local `AGENTS.md` when working inside a workspace.

## Cursor integration

| Path | Purpose |
| --- | --- |
| [`.cursor/rules/monorepo.mdc`](.cursor/rules/monorepo.mdc) | Stack, commands, migration (always on) |
| [`.cursor/rules/work-tracking.mdc`](.cursor/rules/work-tracking.mdc) | Task lifecycle (always on) |
| [`.cursor/rules/studio.mdc`](.cursor/rules/studio.mdc) | Studio app when editing `apps/studio/**` |
| [`.cursor/hooks/`](.cursor/hooks/) | Session bootstrap + work index on task edits |
| [`.cursor/mcp.json`](.cursor/mcp.json) | Project MCP servers (Ant Design docs) |
| [`.vscode/launch.json`](.vscode/launch.json) | Dev server launch configs (web, studio) |

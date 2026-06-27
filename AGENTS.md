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

- Run `pnpm check` before pushing (typecheck + lint + test). Also run `pnpm run work check`.
- Status is derived, not trusted: CI verifies `done` tasks appear in git history.
- Never hand-edit `work/INDEX.md`; regenerate with `pnpm run work index`.
- Follow package- or app-local `AGENTS.md` when working inside a workspace.

## Git workflow

Every change follows this loop:

1. **Branch** — new branch from `main` before editing (`cursor/…` or `feat/TW-NNN-slug`).
2. **Commit & push** — stage only related files; push the branch.
3. **Independent review** — Bugbot or Security Review on the branch diff before merge.
4. **Fix loop** — fix findings, commit, push, re-review until clean.
5. **Merge & cleanup** — squash-merge the PR into `main`; delete the working branch.

See [`.cursor/rules/git-workflow.mdc`](.cursor/rules/git-workflow.mdc).

## Cursor integration

| Path | Purpose |
| --- | --- |
| [`.cursor/rules/git-workflow.mdc`](.cursor/rules/git-workflow.mdc) | Branch, review, squash-merge loop (always on) |
| [`.cursor/rules/monorepo.mdc`](.cursor/rules/monorepo.mdc) | Stack, commands, migration (always on) |
| [`.cursor/rules/work-tracking.mdc`](.cursor/rules/work-tracking.mdc) | Task lifecycle (always on) |
| [`.cursor/rules/studio.mdc`](.cursor/rules/studio.mdc) | Studio app when editing `apps/studio/**` |
| [`.cursor/hooks/`](.cursor/hooks/) | Session bootstrap + work index on task edits |
| [`.cursor/mcp.json`](.cursor/mcp.json) | Project MCP servers (Ant Design docs) |
| [`.vscode/launch.json`](.vscode/launch.json) | Dev server launch configs (web, studio) |

## Cursor Cloud specific instructions

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
- **The `esbuild` "Ignored build scripts" warning from `pnpm install` is harmless** — pnpm 10 blocks
  postinstall scripts by default, but esbuild/tsup/vite still work. No `pnpm approve-builds` needed.

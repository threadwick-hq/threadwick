# Threadwick — worktree container

You are at the *container* of a bare+linked-worktree checkout, not inside the repo itself:

| Path | What |
| --- | --- |
| `.bare/` | the bare git dir — never work in here |
| `main/` | worktree tracking `main`: canonical checkout, all docs |
| `<n>/` | one worktree per in-flight task branch (`feat/<n>-slug`, `n` = issue number; legacy `TW-NNN/` dirs may remain) |

- Git commands fatal at this level ("must be run in a work tree") — run git with `-C main`
  (or `-C <n>`), or cd into a worktree first.
- Repo guidance (work tracking, git workflow, invariants, gotchas): @AGENTS.md
- Workspace: pnpm + Turborepo. Apps `threadwick-studio`, `threadwick-web`; packages
  `@threadwick/{config,core,editor,i18n,icons,org,types}`. Run scripts from a worktree root:
  `pnpm --filter <name> <script>`.
- Work is tracked in GitHub Issues — `pnpm run work list|next|claim|show` from any worktree
  (the CLI needs `gh` auth; the shared cache lives in the common git dir).
- New task = new worktree: `git -C main worktree add ../<n> -b feat/<n>-slug`; after merge,
  `bash main/scripts/cleanup-worktree.sh <n>` (run from inside `main/`).

This file is the tracked source of the container-level `CLAUDE.md` symlink; the container also
symlinks `AGENTS.md` and `.claude/settings.json` into `main/` (see `scripts/bootstrap-container.sh`).

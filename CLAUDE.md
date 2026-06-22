# Threadwick — agent guide

Monorepo: pnpm workspaces + Turborepo. Apps in `apps/*` (studio, web); packages in `packages/*`
(config, core, icons, org, types; `editor` lands in Phase 6). Lint + format: Biome. The migration
plan is [MIGRATION.md](MIGRATION.md).

Run `pnpm check` (typecheck + lint + test) before pushing.

## Work tracking

All work is tracked as `work/TW-NNN-*.md` files in git — the source of truth, not GitHub Issues.
Read [work/README.md](work/README.md) for the full lifecycle and schema. Commands:

- `pnpm run work next [--area A] [--phase N]` — the next claimable backlog task.
- `pnpm run work check` — validate frontmatter + run the gates (this is the hard CI gate).
- `pnpm run work index` — regenerate `work/INDEX.md` after any frontmatter change.
- `pnpm run work new --title "..." --type feat --area apps/web --phase 6` — scaffold a task.

To work a task: set `status: active` + `assignee` + `started`, branch `feat/TW-NNN-slug`, end every
commit with `Refs TW-NNN`, open the PR with `Closes TW-NNN`, and set `status: done` + `completed` +
`pr` on merge. CI enforces that a `done` task is referenced by a real commit and that anything a
commit closes is actually `done`. Never hand-edit `work/INDEX.md`; run `pnpm run work index`.

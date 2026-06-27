# AGENTS.md — Threadwick Studio

Read [README.md](README.md) for architecture. Cursor loads [`.cursor/rules/studio.mdc`](../../.cursor/rules/studio.mdc)
when editing files under `apps/studio/`.

**Also read:** root [AGENTS.md](../../AGENTS.md), [docs/BRAND.md](docs/BRAND.md), [MIGRATION.md](../../MIGRATION.md).

Chart core lives in [`@threadwick/editor`](../../packages/editor/README.md) — not in this app.

```sh
pnpm --filter threadwick-studio dev      # port 5174
pnpm --filter threadwick-studio build
pnpm --filter threadwick-studio test
```

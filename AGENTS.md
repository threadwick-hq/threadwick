# AGENTS.md

This repo's primary agent guide is [`CLAUDE.md`](CLAUDE.md) (monorepo overview, work-tracking
workflow) and [`README.md`](README.md) (architecture). Per-area notes live in
`apps/*/CLAUDE.md` and `packages/*/README.md`. Read those first — this file only adds
Cursor Cloud specifics.

## Cursor Cloud specific instructions

Dependencies are installed automatically on startup (`pnpm install`). Node 22 + pnpm 10 are
preinstalled. Standard commands are documented in `README.md` / `CLAUDE.md`; the notes below are the
non-obvious gotchas.

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

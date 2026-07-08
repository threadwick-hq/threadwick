# Threadwick

A free home for fiber artists to design, keep, and share their patterns — and for makers to follow
them.

Monorepo managed with **pnpm** workspaces + **Turborepo**, being assembled per
[MIGRATION.md](MIGRATION.md). One **React Router 7** app with streaming SSR; UI on **shadcn/ui +
Tailwind v4**; lint + format with **Biome**. Open source under **AGPL-3.0-or-later**.

## Layout

```
packages/
  config/   shared tsconfig + biome + tailwind base
  types/    the Pattern content model (+ pattern.schema.json)
  core/     OKLCH design tokens + Tailwind preset + shadcn components + brand
  icons/    semantic <Icon name> interface (Font Awesome adapters)        — README
  editor/   framework-agnostic chart-editor core (. = SSR-safe, /browser = client)  — README
  i18n/     localization: enriched EN source + Claude pipeline + ICU runtime — README
  org/      typed canon
apps/
  web/      RR7 streaming-SSR app: marketing (live) + /studio + marketplace (Phase 6+)
  studio/   the legacy Studio, mid-migration; its chart core now lives in @threadwick/editor
```

## Status & resuming work

All work is tracked as GitHub Issues (the issue body is the spec; status is derived from native
GitHub state) — see [work/README.md](work/README.md) and [AGENTS.md](AGENTS.md). To pick up where
the last contributor left off:

```sh
pnpm install
pnpm run work next        # the next claimable issue
pnpm run work claim <n>   # claim (assign yourself) before implementing
pnpm check                # typecheck + lint + test
```

The [issues list](https://github.com/threadwick-hq/threadwick/issues) and the "Threadwick Work"
project board are the at-a-glance views; [MIGRATION.md](MIGRATION.md) is the
phase plan and the decision record. Phases 0–5 (monorepo, packages, design system, marketing site)
are done; the localization layer shipped; **Phase 6** (Studio app surface) is underway — sub-phase
6a (extracting the editor into `@threadwick/editor`) and the 6c chrome migration (AntD → shadcn,
with AntD removed entirely in #63) are complete, and the app-surface build-out continues.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) and the [Contributor License Agreement](CLA.md).

## License

**AGPL-3.0-or-later** — see [LICENSE](LICENSE). Third-party icon notices are in [NOTICE](NOTICE).

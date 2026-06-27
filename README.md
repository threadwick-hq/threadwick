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

All work is tracked as `work/TW-NNN-*.md` files (the source of truth, not GitHub Issues) — see
[work/README.md](work/README.md) and [AGENTS.md](AGENTS.md). To pick up where the last contributor left off:

```sh
pnpm install
pnpm run work next        # the next claimable task
pnpm run work claim TW-NNN   # claim before implementing
pnpm check                # typecheck + lint + test
```

[`work/INDEX.md`](work/INDEX.md) is the at-a-glance status table; [MIGRATION.md](MIGRATION.md) is the
phase plan and the decision record. Phases 0–5 (monorepo, packages, design system, marketing site)
are done; the localization layer shipped; **Phase 6** (Studio app surface) is underway — sub-phase
6a (extracting the editor into `@threadwick/editor`) is complete, and the chrome migration
(AntD → shadcn) is next.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) and the [Contributor License Agreement](CLA.md).

## License

**AGPL-3.0-or-later** — see [LICENSE](LICENSE). Third-party icon notices are in [NOTICE](NOTICE).

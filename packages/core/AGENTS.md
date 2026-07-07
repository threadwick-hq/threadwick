# AGENTS.md — read this first

`@threadwick/core` is Threadwick's **design-system foundation**: design tokens (OKLCH, light +
dark), the Ant Design theme, the **brand** wordmark, and shared UI primitives. Threadwick is built
by AI agents, so this repo is optimised for machine consumption and **machine-enforced correctness**
— "wrong" should fail to compile or fail a check, not rely on you reading prose.

> **Sibling package** (split out so the foundation stays crochet-agnostic): **`@threadwick/types`**
> (the Pattern content model). The crochet stitch renderers are app-local for now — a future
> **`@threadwick/domain`** when a second surface needs them.

## What this is (and is not)
- **Is:** the tokens-first design-system foundation — tokens, theme, brand, and shared primitives
  that every surface installs.
- **Is not:** a Storybook product, a component zoo, the pattern model, or the org canon (those are
  sibling packages). Components are extracted from the apps **on demand**. Right-size everything.

## Where things live
| Path | What | Edit? |
|---|---|---|
| `src/tokens/tokens.json` | **SOURCE OF TRUTH** — DTCG tokens (OKLCH + hex, 8-px scale, type, radius, shadow) | ✅ edit here |
| `src/tokens/palette.ts` · `tokens.ts` · `tokens.css` | **GENERATED** from tokens.json | ❌ never hand-edit |
| `figma/FOUNDATIONS.md` · `figma/variables.json` · `docs/foundations.md` | **GENERATED** token↔hex references + Figma variables | ❌ never hand-edit |
| `src/components/` | thin shared UI — seed: `Stack` (8-px spacing guardrail); grow incrementally | ✅ |
| `scripts/build-tokens.ts` | codegen: tokens.json → the generated files | ✅ |
| `scripts/check-contrast.ts` | WCAG AA gate (OKLCH→sRGB) | ✅ |
| `scripts/validate.ts` | conformance checker (off-grid / non-token / aria) | ✅ |
| `src/theme/antd.ts` | `lightTheme` + `darkTheme` (AntD `ThemeConfig`) | ✅ |
| `src/brand/Wordmark.tsx` · `assets/` | logo mark + wordmark + svg assets | ✅ |

## Invariants (do not break)
1. **One source, generate the rest.** Change colour/space/type ONLY in `tokens.json`, then run
   `npm run build:tokens`. Never hand-edit a generated file.
2. **OKLCH is authoritative**; sRGB hex is a legacy fallback. But OKLCH `L` ≠ WCAG luminance — every
   token change must keep `npm run check:contrast` green (AA in both modes).
3. **8-px grid.** Layout uses `space` keys; 4 for intra-component gaps, 2 for hairlines. Type stays
   off-grid. No raw px where a token exists.
4. **No raw `#hex` / `px` in app/component code** — use `--tw-*` CSS vars, token exports, or the
   `Stack` helper (`gap` accepts only `space` keys). ESLint bans raw hex; `npm run validate` flags
   non-token-colour / off-grid px / missing-aria / AA failures. Both run in `npm run check`.
5. **Accessibility is WCAG 2.1 AA, baked in.** Never colour-only (keep stitch symbols). `tokens.css`
   ships the `:focus-visible` ring + a `prefers-reduced-motion` guard; consumers inherit them.
6. **Controlled vocabulary.** `Component`, never "motif/piece" — one canonical name per concept
   (the org canon vocabulary).

## How to change a token
Edit `src/tokens/tokens.json` (the OKLCH `$extensions["com.threadwick"].oklch` triple is
authoritative; keep `$value`/`.dark.value` hex in step). Then:
```
npm run build:tokens && npm run check:contrast && npm run typecheck
```

## How to add a shared component
Build it token-only (CSS vars / token exports), export it from `src/components`, and meet the
**a11y gate**: keyboard-operable · visibly focusable · labelled · AA-contrast · never colour-only ·
reduced-motion-safe · screen-reader-checked.

## Commands
- `npm run build:tokens` — regenerate token artifacts (auto-runs as `prebuild`)
- `npm run check` — tokens + typecheck + lint + contrast (the green bar)
- `npm run validate [paths]` — conformance scan
- `npm run build` — `tsup` → `dist/` (ESM + `.d.ts` + `tokens.css`)

## How apps consume core
```ts
import { lightTheme, darkTheme } from '@threadwick/core/theme';
import '@threadwick/core/tokens.css';
// <ConfigProvider theme={mode === 'dark' ? darkTheme : lightTheme}>
// document.documentElement.dataset.theme = mode;   // 'light' | 'dark'
```
Apps **import, never redefine** — delete local `tokens.*` / `theme.*` and re-export from core.

See `llms.txt` (machine manifest) and `docs/principles.md` (the "why").

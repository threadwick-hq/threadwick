# @threadwick/core

Threadwick's **design-system foundation**: **design tokens** (OKLCH, light + dark), the **Ant Design
theme**, the **brand** wordmark, and shared UI primitives. Both Threadwick apps (`home`, `studio`)
import from here so they read as one product — instead of hand-syncing a theme three times. The
Pattern model, org canon, and shared config live in sibling packages (`@threadwick/types`,
`@threadwick/org`, `@threadwick/config`).

> Built by AI agents — see [AGENTS.md](AGENTS.md) (read first) and [llms.txt](llms.txt).

## Install

```sh
npm install @threadwick/core
# peers: react ^18, react-dom ^18, antd ^5, iconoir-react ^7
```

Initially you can link it via an npm workspace / path dependency — no need to publish to a registry.

## Usage

```tsx
import { ConfigProvider } from 'antd';
import { lightTheme, darkTheme } from '@threadwick/core/theme';
import '@threadwick/core/tokens.css'; // ships --tw-* vars + :focus-visible ring + reduced-motion guard

export function App({ mode }: { mode: 'light' | 'dark' }) {
  document.documentElement.dataset.theme = mode; // drives [data-theme="dark"]
  return (
    <ConfigProvider theme={mode === 'dark' ? darkTheme : lightTheme}>
      {/* … */}
    </ConfigProvider>
  );
}
```

**Dark-mode toggle:** persist `mode` in `localStorage`, default from
`window.matchMedia('(prefers-color-scheme: dark)')`, and set `document.documentElement.dataset.theme`.

## Exports

| Subpath | Contents |
|---|---|
| `@threadwick/core` | `tokens`, theme (re-exports; not the stylesheet) |
| `@threadwick/core/tokens` | `tokens.light` / `tokens.dark` (OKLCH), `space`, `size`, `radii`, `sizing`, `fonts`, `shadows`; palette helpers `oklch()`, `L()` |
| `@threadwick/core/theme` | `lightTheme`, `darkTheme` (AntD `ThemeConfig`) |
| `@threadwick/core/tokens.css` | `:root` (light) + `[data-theme="dark"]` custom properties + a11y rules |
| `@threadwick/core/brand` | `Wordmark`; `Logo` badge + `ThreadwickLogo` / `StudioLogo` / `MarketplaceLogo`; `logoSVG()` (static SVG), `fromAwesome()` |
| `@threadwick/core/components` | `Stack` (8-px spacing guardrail) |

Sibling packages: **`@threadwick/types`** (Pattern model + schema), **`@threadwick/org`** (typed canon), **`@threadwick/config`** (tsconfig/eslint/prettier).

## Tokens

Authored once in [`src/tokens/tokens.json`](src/tokens/tokens.json) (DTCG, OKLCH) and **generated**
into `palette.ts` / `tokens.ts` / `tokens.css` / foundations — never hand-edit the outputs. Role
tokens (light + dark): `primary`, `onPrimary`, `primaryHover`, `primaryActive`, `link`,
`primarySoft`, `primaryWash`, `text`, `textSecondary`, `textTertiary`, `bgLayout`, `bgContainer`,
`bgElevated`, `bgSunken`, `border`, `borderSecondary`, `focus`; plus the `yarn` craft palette and
`success` / `warning` / `danger` / `info`. Full values: [docs/foundations.md](docs/foundations.md).

CSS variables use the `--tw-*` prefix, e.g. `var(--tw-primary)`, `var(--tw-bg-layout)`,
`var(--tw-space-16)`, `var(--tw-radius-lg)`, `var(--tw-font-display)`.

## Scripts

| Script | What |
|---|---|
| `npm run build:tokens` | regenerate token artifacts from `tokens.json` (auto-runs before build) |
| `npm run build` | `tsup` → `dist/` (ESM + `.d.ts` + `tokens.css`) |
| `npm run typecheck` / `lint` | `tsc --noEmit` / `eslint .` |
| `npm run check:contrast` | WCAG AA gate (OKLCH → sRGB, both modes) |
| `npm run validate [paths]` | conformance scan (off-grid / non-token-colour / missing-aria) |
| `npm run check` | tokens + typecheck + lint + contrast |

## License

AGPL-3.0-or-later © Threadwick — see [LICENSE](LICENSE). Importing `@threadwick/core` carries its
copyleft. Brand name + marks © Threadwick; trademark, legal entity, and a formal privacy policy/ToS
are still TBD (see `@threadwick/org` → legal).

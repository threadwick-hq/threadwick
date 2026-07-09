# @threadwick/core

Threadwick's **design-system foundation**: **design tokens** (OKLCH, light + dark), the **brand**
wordmark, and shared UI primitives (shadcn-style, on Radix). Both Threadwick apps (`home`, `studio`)
import from here so they read as one product — instead of hand-syncing a theme three times. The
Pattern model lives in the sibling package `@threadwick/types`.

> Built by AI agents — see [AGENTS.md](AGENTS.md) (read first) and [llms.txt](llms.txt).

## Install

```sh
npm install @threadwick/core
# peers: react ^18
```

Initially you can link it via an npm workspace / path dependency — no need to publish to a registry.

## Usage

```tsx
import { Button, FeedbackProvider } from '@threadwick/core/components';
import '@threadwick/core/tokens.css'; // ships --tw-* vars + :focus-visible ring + reduced-motion guard
import '@threadwick/core/theme.css'; // shadcn role tokens mapped onto the brand tokens

export function App({ mode }: { mode: 'light' | 'dark' }) {
  document.documentElement.dataset.theme = mode; // drives [data-theme="dark"]
  return (
    <FeedbackProvider>
      {/* … */}
    </FeedbackProvider>
  );
}
```

**Dark-mode toggle:** persist `mode` in `localStorage`, default from
`window.matchMedia('(prefers-color-scheme: dark)')`, and set `document.documentElement.dataset.theme`.

## Exports

| Subpath | Contents |
|---|---|
| `@threadwick/core` | `tokens` (re-exports; not the stylesheet) |
| `@threadwick/core/tokens` | `tokens.light` / `tokens.dark` (OKLCH), `space`, `size`, `radii`, `sizing`, `fonts`, `shadows`; palette helpers `oklch()`, `L()` |
| `@threadwick/core/tokens.css` | `:root` (light) + `[data-theme="dark"]` custom properties + a11y rules |
| `@threadwick/core/theme.css` | shadcn role tokens (`--background`, `--primary`, …) mapped onto the brand tokens |
| `@threadwick/core/brand` | `Wordmark`; `Logo` badge + `ThreadwickLogo` / `StudioLogo` / `MarketplaceLogo`; `logoSVG()` (static SVG), `fromAwesome()` |
| `@threadwick/core/components` | `Stack` (8-px spacing guardrail); the shadcn-style `ui/` primitives (Accordion, Alert, AlertDialog, Badge, Breadcrumb, Button, Card, ColorPicker, Dialog, DropdownMenu, Input, Label, NumberInput, Segmented, Select, Switch, Tooltip, `FeedbackProvider` toast/confirm); the `follow/` · `interior/` · `overview/` screen kits — authoritative list: [`src/components/index.ts`](src/components/index.ts) |

Sibling package: **`@threadwick/types`** (Pattern model + schema).

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
| `npm run build:tokens` | regenerate the committed token artifacts from `tokens.json` |
| `npm run typecheck` / `lint` | `tsc --noEmit` / `eslint .` |
| `npm run check:contrast` | WCAG AA gate (OKLCH → sRGB, both modes) |
| `npm run validate [paths]` | conformance scan (off-grid / non-token-colour / missing-aria) |
| `npm run check` | tokens + typecheck + lint + contrast |

## License

AGPL-3.0-or-later © Threadwick — see [LICENSE](LICENSE). Importing `@threadwick/core` carries its
copyleft. Brand name + marks © Threadwick; trademark, legal entity, and a formal privacy policy/ToS
are still TBD.

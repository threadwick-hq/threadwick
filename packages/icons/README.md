# @threadwick/icons

One semantic `<Icon name>` interface for the whole app. You name **the action**, never the glyph —
so a glyph can be swapped, or two actions can diverge, without touching a single call site.

```tsx
import { Icon } from '@threadwick/icons';

<Icon name="rotate-stitch-right" />        // labelled for assistive tech by default
<Icon name="undo" label="" />              // decorative (the button owns the label)
<Icon name="publish-pattern" className="text-brand" />
```

## How it works

- **`contract.ts`** owns the closed `IconName` union (intent names like `rotate-stitch-right`,
  `publish-pattern`, `select-mode`) and `iconMeta` (the default accessible label per action).
- **`sets/*`** are one-file adapters that map every action to a concrete glyph. `fa-free` (Font
  Awesome Free solid + a couple of brands) is the installable baseline; **FA Pro** is layered in at
  build time via a Vite alias when `FONTAWESOME_NPM_AUTH_TOKEN` is present, so a token-less clone
  still builds.
- The glyph map is typed `Record<IconName, IconDefinition>` and `iconMeta` is
  `Record<IconName, IconMeta>`, so **`tsc` proves** every action has both a label and a glyph —
  add a name without wiring it up and the build fails.

## Adding an icon

1. Add the intent name to the `IconName` union and a label to `iconMeta` in `contract.ts`.
2. Map it to a glyph in each set under `sets/` (at minimum `fa-free`).

Names are **action/intent-specific, never glyph names** — `rotate-stitch-right`, not
`arrow-rotate-right`. Distinct actions may share a glyph today and diverge later. Keep generic
chrome (`close`, `search`) generic; give domain actions domain names.

> Note: `apps/studio/src/icons.tsx` is a **transitional shim** that re-exposes the old glyph-named
> aliases (`UndoIcon`, …) backed by `<Icon name>`. The 6c chrome rebuild (AntD → shadcn) retires it
> by calling `<Icon name>` directly. Crochet **stitch symbols** are a separate, craft-fixed concern
> (in `@threadwick/editor`), not chrome icons — don't route them through here.

## License

AGPL-3.0-or-later © Threadwick. Font Awesome Free is CC BY 4.0 (see the repo `NOTICE`).

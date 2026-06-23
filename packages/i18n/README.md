# @threadwick/i18n

The localization layer. One enriched English source of truth in git; everything else is
generated. Mirrors the `tokens.json -> tokens.css` codegen pattern in `@threadwick/core`.

The decision behind this package (custom spine over an off-the-shelf TMS) and the spike that
validated it are recorded in `work/TW-009-localization-layer.md`.

## Pipeline

```
source/en/*.json        enriched source: { text, context, maxLength, placeholders, icu, glossaryRefs, tone, ... }
  + glossary.json       controlled vocabulary; per-locale canonical terms, brand terms kept verbatim
  + voice.json          brand voice + gender policy
        |
   i18n:translate       Claude translates deltas only (hashed); human overrides never clobbered
        v
translations/<l>/*.json  the translation memory, with a fingerprint + provenance per entry
  + overrides/<l>.json   human overrides, always win
        |
   i18n:codegen         strip context -> messages/<l>/*.json + src/generated/{keys,bundles}.ts
        v
   src/runtime.ts        createTranslator(locale, messages) over intl-messageformat (ICU)
   src/negotiate.ts      negotiateLocale(url > cookie > Accept-Language) for SSR + client
        |
   i18n:lint            nine rules guard glossary, ICU plurals, placeholders, and length budgets
```

## Scripts

- `pnpm run i18n:translate` — translate changed entries. Needs `ANTHROPIC_API_KEY` (or `--echo`
  for an offline fill). `--force` re-translates everything; `--locale pl` narrows to one locale.
- `pnpm run i18n:codegen` — regenerate the runtime bundles, typed keys, and bundle loader.
- `pnpm run i18n:lint` — run the lint gate.
- `pnpm run i18n` — translate, then codegen, then lint.

`src/generated/*` and `messages/*` are generated but committed, so the package builds with no
pre-step. Re-run codegen after editing the source.

## Consuming it (app side)

```ts
import { createTranslator, getMessages, negotiateLocale } from '@threadwick/i18n';

const locale = negotiateLocale({ url, cookie, acceptLanguage });
const { t } = createTranslator(locale, getMessages(locale, 'common'));
t('count_patterns', { count: 3 }); // ICU plural, resolved for the locale
```

## Status

Seeded with a minimal `common` namespace to prove the architecture end to end. The full
marketing and studio catalogs are authored during the Phase 6 refactor, not here.

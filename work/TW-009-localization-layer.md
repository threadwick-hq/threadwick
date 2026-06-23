---
id: TW-009
title: Introduce @threadwick/i18n (enriched source + Claude translation pipeline + typed runtime + CI lint)
type: feat
area:
  - packages/i18n
  - apps/web
  - repo
phase: 6
status: done
priority: p1
created: 2026-06-23
assignee: agent
started: 2026-06-23
completed: 2026-06-23
pr: 4
acceptance:
  - packages/i18n exists with an enriched EN source schema (text, context, maxLength, placeholders, icu, glossaryRefs, tone, doNotTranslate, worstCaseSample), a glossary, and a voice config, all committed and namespaced by surface (common, marketing, studio)
  - a Claude translation pipeline emits per-locale bundles with hash-based change-detection and a human-override channel that survives re-translation (re-uses Lingo.dev's i18n.lock + lockedKeys pattern, reimplemented)
  - build-time codegen produces context-stripped locale bundles plus a generated TS key union; runtime is a thin wrapper over intl-messageformat (ICU)
  - a CI lint gate enforces the nine spike-derived rules and is wired into pnpm check / work check, failing on any violation
  - pl ships end to end as the first translation target, validated against the lint with zero violations
---

## Context

A localization layer the owner wants in place before the Phase 6 studio refactor, so both
apps/web and the (about to be extracted) studio consume one source. The model is the existing
`tokens.json -> tokens.css` codegen pattern in `@threadwick/core`, applied to strings: one
enriched EN source of truth in git, everything else generated.

Two findings settled the approach:

1. **Build-vs-buy (multi-tool comparison, this session).** No git-native i18n format models the
   owner's enriched `{text, context, ...}` schema. Paraglide is the best off-the-shelf runtime but
   its data model has no context/maxLength/glossary field. The tools that do model the schema
   (Tolgee, Crowdin, Lokalise, Phrase) host it in their cloud (lock-in, off the AGPL doctrine) or
   gate it commercially. So adopting a tool still means building the enrichment layer plus a Claude
   step in front. Decision: build the custom spine, borrow the change-detection + override pattern,
   defer a reviewer UI.
2. **Adherence spike (EN to PL, 36-string corpus, 3 independent Claude passes + QA judge).** Verdict
   `custom-safe-with-lint`. Glossary adherence 100% (0 violations across ~90 checks). Polish ICU
   4-form plurals (one/few/many/other) 100% correct and byte-identical across passes. Placeholder
   integrity 100%. maxLength 0 overflows. The only correctness bug was a SOURCE defect (a bare
   `{count}` next to a countable noun, impossible to agree in Polish), which the schema rule and lint
   catch. Run-to-run prose drift was 19.4%, handled by locking approved strings in a translation
   memory rather than regenerating.

**US/UK crochet terminology is out of scope here.** It is a craft-convention preference orthogonal
to UI language (en-GB UI with US terms is valid), already authored as data in
`apps/web/app/data/stitches.ts` via `CrochetRegion` / `stitchName()`. The glossary in this package is
for cross-language term consistency (EN to pl/es), not the US/UK split.

## Scope

In:
- `packages/i18n` (`@threadwick/i18n`): enriched EN source, glossary, voice config, codegen,
  thin intl-messageformat runtime, the Claude translation pipeline, and the CI lint suite.
- pl as the first translation target; en is the source.
- Retrofit apps/web marketing strings onto the layer.

Out:
- RR7 SSR locale negotiation wiring into apps/web routing and the apps/web string retrofit beyond a
  proof slice (split to a follow-up once the package lands).
- es and further locales (add after pl is proven).
- A reviewer/translator UI. Git PRs are the review surface until a non-dev reviewer enters the loop;
  then point a self-hosted Tolgee (Apache-2.0 core) at the same JSON. Do not build an editor.
- Any change to the US/UK stitch-terminology system (stays in the stitch/symbols domain).

## Design

Source of truth (committed, namespaced by surface):
- `source/en/{common,marketing,studio}.json` enriched entries:
  `{ text, context, maxLength?, placeholders?, icu?, glossaryRefs?, tone?, doNotTranslate?, worstCaseSample? }`.
- `glossary.json`: canonical per-term map keyed by concept, each `{ pl, es?, ..., translate?: false, abbrUS? }`.
- `voice.json`: brand voice plus a grammatical-gender policy (prefer gender-neutral PL rewrites, or an
  explicit gender field). Drove by the `skończyłaś` feminine-form finding in the spike.

Schema rules derived from the spike:
- A numeric placeholder adjacent to a countable noun MUST be `icu: true` (the bare-`{count}` defect).
- `maxLength` on a string containing an unbounded placeholder is statically unenforceable: require a
  `worstCaseSample` and check that instead of the template.
- `doNotTranslate` is a structured per-placeholder flag (e.g. `{name}`), not just a prose note.
- palette entries may surface the US abbreviation (`abbrUS`) alongside the translated term.

Translation pipeline (Claude, scripted in CI, agent-first):
- Hash each entry over `text + context + glossaryRefs + voice + maxLength`; translate only deltas.
- Re-use Lingo.dev's `i18n.lock` SHA-256 + `lockedKeys` / `preservedKeys` pattern (reimplemented over
  our JSON) so human overrides survive re-translation. Approved PL is locked in a translation memory;
  a locked key is not regenerated without re-approval (kills the 19.4% prose drift).
- We own the prompt, the model pin, glossary/voice injection, batching, and retries.

Outputs (build-time codegen):
- `dist/<locale>/<namespace>.json`: context-stripped `{key: value}` bundles, code-split per
  locale/namespace (lean for the mobile/older audience, precached for the offline PWA).
- `dist/keys.generated.ts`: a TS key union for compile-time key safety.
- Runtime: a thin wrapper over `intl-messageformat` (ICU; ships CLDR plural rules, so we do not
  reimplement them).

CI lint gate (the condition behind `custom-safe-with-lint`; wired into `pnpm check` / `work check`):
1. GLOSSARY-TERM: canonical PL surface present (diacritic-exact); `translate:false` tokens verbatim.
2. PLACEHOLDER-PARITY: `{var}` multiset identical between source and target.
3. ICU-PARSE: parse every icu string with `@formatjs/icu-messageformat-parser`; fail on syntax error.
4. ICU-LOCALE-CATEGORIES: per locale, each plural arg defines exactly the CLDR-required categories
   (pl: one + few + many + other).
5. ICU-HASH-PRESENT: `#` preserved in branches that had it.
6. MAXLENGTH-STATIC: visible length within budget for placeholder-free entries; warn and require a
   `worstCaseSample` otherwise.
7. BARE-COUNT-NEEDS-ICU: a numeric placeholder next to a countable noun must be `icu:true`.
8. TM-LOCK / CONSISTENCY: approved PL hashed; regenerating a locked key requires re-approval.
9. NO-EMPTY / NO-UNTRANSLATED: non-empty, and differs from EN except for genuine keep-as-is tokens.

## Acceptance

- [x] packages/i18n with enriched EN source schema, glossary, and voice config, namespaced by surface
- [x] Claude pipeline with hash-based change-detection and an override channel that survives re-translation
- [x] codegen emits context-stripped locale bundles plus a generated TS key union; runtime over intl-messageformat
- [x] CI lint enforces the rules and runs under the package's test (so `pnpm check` gates it)
- [x] pl ships end to end with zero lint violations

## Follow-ups (separate tasks)

- RR7 SSR locale negotiation (url > cookie > Accept-Language, request-isolated) and the full apps/web
  string retrofit.
- es and further locales once pl is proven.
- Self-hosted Tolgee on the same JSON, only if and when a non-dev reviewer enters the loop.

## Open questions

- Translation-memory store: a committed lockfile per locale, or a single `i18n.lock`.
- Where the pipeline runs: a local `pnpm run i18n` an agent invokes, versus a CI job on source change.

## Log

- 2026-06-23 created. Backed by a build-vs-buy tooling comparison and an EN to PL adherence spike
  (verdict custom-safe-with-lint) run this session.
- 2026-06-23 implemented @threadwick/i18n: enriched schema, glossary, voice, Claude pipeline
  (change-detection + override lock), codegen (stripped bundles + typed keys + bundle loader), thin
  intl-messageformat runtime, RR7 SSR negotiation, and a 10-rule lint (the spike's nine plus
  ICU_PLURAL_DROPPED). A 4-lens adversarial review surfaced 7 semantic holes (ICU plural-drop,
  bare-count separators, maxLength worstCaseSample, hash coverage, doNotTranslate prompt injection,
  override-JSON safety, runtime degradation); all fixed with regression tests. Biome + typecheck
  clean, 31 tests pass, real-seed lint ok. Seeded a minimal `common` namespace; the full marketing
  and studio catalogs are authored during the Phase 6 redesign build.

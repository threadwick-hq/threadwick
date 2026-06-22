---
name: threadwick-org
description: Canonical org-wide knowledge for Threadwick — mission, audience, principles, voice, vocabulary, legal. Lives in threadwick-core as `@threadwick/core/org` + docs/org.md.
audience: AI agents (primary), then humans
status: DRAFT items need owner sign-off; CONFIRMED items are established in the project
---

# Threadwick — org knowledge (canonical)

This is the single source an agent reads before building anything Threadwick. Structured facts are
mirrored as the typed module `@threadwick/core/org` (so copy is imported, never hand-typed —
e.g. the marketing site's meta description and hero pull from `org.mission` / `org.tagline`).

`[CONFIRMED]` = established in the project. `[DRAFT]` = proposed by an agent; **owner must confirm or replace.**

## Mission `[CONFIRMED]`
> A free home for **fiber artists** to design, keep, and share their patterns — and for **makers**
> to follow them.

## Vision `[CONFIRMED]`
> Every fiber artist's patterns, charts, yarns, and notes in one place they truly own — no account,
> no lock-in — and any maker able to open a pattern and make it, on any device.

## Tagline `[CONFIRMED]`
"A home for fiber artists." (Used in the wordmark + marketing.)

## Values `[CONFIRMED]`
1. **Craft-first** — we speak the craft (stitches, symbols, US/UK terms) and build tools shaped to how
   fiber artists actually work, not generic software bent to fit.
2. **Warm & calm** — cozy and paper-like, never corporate, loud, or gamified.
3. **Yours, and local-first** — your work lives in your browser; free, no account, export any time, no
   lock-in.
4. **Accessible to everyone** — WCAG AA, every device, every age and ability; never colour-only.
5. **One coherent home** — every surface feels like one app.

## Voice & tone `[CONFIRMED]`
Warm, encouraging, plain. Talk like a knowledgeable friend at a craft circle, not a SaaS landing page.
Short sentences, sentence case, craft-native vocabulary (with US/UK). Encourage beginners; respect
experts. No hype, no dark patterns, no jargon. When speaking to makers, prefer "pattern / square /
round" over abstract product terms.

## Audience `[CONFIRMED]`
- **Primary — fiber artists** (pattern/chart *designers*). They use the full **Studio editor**.
- **Secondary — makers**. They do **not** use the editor; they use the read-only **viewing / follow
  mode**. Skews older, mobile-heavy, mixed tech comfort.

## Products & surfaces `[CONFIRMED]`
Threadwick is **three fronts over one object (the Pattern) across its lifecycle** — not three apps:
- **Studio** — for **artists**. The chart designer (project page → editor); *design* the pattern.
  Local-first / no-account for solo designing. (threadwick.com/studio)
- **Marketplace** — for **everyone**. Discover · buy/sell · share; the home of the publishing/
  consumption layer (listings, reviews, "more by this designer", maker galleries).
- **Viewer** — for **makers**. Read-only follow mode (big chart + round tracker); *make* the pattern.
- **threadwick.com** — marketing front door that routes into all three.
- **threadwick-core** — shared design system, org knowledge, types, and domain primitives (the base).

### System cohesion `[CONFIRMED — strategy]`
They feel like one system because everything below the fronts is shared and the seams are invisible:
1. **One object + one data layer** — the same `Pattern` flows through all three (shared types +
   `@threadwick/data`); never re-modelled or copied. *(deepest tie)*
2. **One identity + one library** — your patterns = designed + bought + making, in one place.
   **Free & local by default; sign in to sell / buy / sync** (resolves Studio's no-account promise vs
   the Marketplace's need for accounts).
3. **One design-system frame** — `threadwick-core`; the *same* pattern-card / shell renders everywhere.
4. **The Pattern page is the connective tissue** — one role-aware hub (maker → Make it/Buy; owning
   artist → Edit/List; marketplace → price + reviews).
5. **Invisible handoffs (verbs)** — Publish (Studio→Market), Make it (Market→Viewer), Open in Studio /
   Remix (Viewer→Studio), More-by-designer (Viewer→Market). Follow the object, never "switch apps."
6. **Fluid roles** — maker ↔ artist is a *mode*, not an account type (Viewer↔Studio = view vs edit of
   one pattern).
7. **One domain + coherent URLs + one vocabulary.**

Open forks: exact identity/account threshold · local-first→listed-product sync & ownership · three apps
vs one shell (**strongest case yet for a monorepo**) · keeping commerce calm and fair to artists.

## Namespaces & handles `[CONFIRMED]`
The brand name **Threadwick** is taken as a bare GitHub user (`github.com/threadwick` — an unrelated
2024 account described as a "clothing brand"; **not us**, do not reference it). The brand, domain, and
package scope are unaffected — only the GitHub org *slug* differs:

- **Brand / display name:** Threadwick (used everywhere user-facing, incl. the GitHub org's display name).
- **Domain:** `threadwick.com` (Studio at `/studio`).
- **GitHub org:** **`threadwick-hq`** (display name "Threadwick"). Because the org already namespaces
  "threadwick," repos use **short names** — no `threadwick-` prefix. Repos for now (3):
  **`threadwick-hq/core`** (shared), **`threadwick-hq/studio`** (the Studio app — rename/transfer from
  `Eiluviann/threadwick`; GitHub redirects old URLs), **`threadwick-hq/home`** (marketing). Org slug is
  easily renamed later.
- **npm scope:** **`@threadwick`** — packages keep the brand namespace regardless of repo name
  (`@threadwick/core`, `@threadwick/config`). Appears free; register the npm org to secure it.
- **Local checkouts:** clone under a `threadwick/` workspace folder so the short dir names
  (`core` / `studio` / `home`) stay unambiguous on disk — matters for agents juggling repos.
- **Reserve** the unused `getthreadwick` GitHub handle to avoid collisions.

## Controlled vocabulary / glossary `[CONFIRMED]`
- **Project** — a *make* (maker plane); references one or more Patterns.
- **Pattern** — the authored design (the Studio sidebar root).
- **Component** — a worked unit of a pattern (`motif | panel | part | assembly`; optional/implicit for
  single-piece patterns). Use "Component," not "motif/piece," as the canonical term.
- **Artifact** — a view under a Component: `Chart | Written instructions | Schematic`.
- **Material** (`yarn | hook | needle | notion`), **Tutorial** (`project | technique`), **Stitch**
  (`special | abbreviation`), **Note** (`general | gauge | care | safety | colorchange | stuffing`),
  **Variation** (`size | colorway | yarn-weight | technique | difficulty`).
- **Two-plane taxonomy** — authoring artifacts (the sidebar tree) vs publishing/consumption chrome
  (comments, ratings, ads, PDF export) the platform renders. Plus US/UK stitch terminology.

## Standing decisions / standards `[CONFIRMED]`
(Discoverable here so they don't silently drift; details in the design-system spec.)
- **Accessibility:** WCAG 2.1 AA, non-negotiable. Never colour-only (crochet symbols carry meaning).
- **Responsive:** flawless on all devices; one codebase; panes → stack on phone.
- **Colour:** authored in **OKLCH** (Brick & Ecru); sRGB hex is a legacy fallback only.
- **Spacing/sizing:** **8-px grid** (4-px sub-grid for intra-component gaps).
- **One design language:** enforced via `threadwick-core` (single source + lint + CI), not by discipline.
- **Agent-first:** docs + system optimised for AI consumption + machine-enforced correctness.

## Brand `[CONFIRMED]`
- Name **Threadwick** (lowercase wordmark "threadwick"; "studio" sub-label in-app).
- Palette **Brick & Ecru** (OKLCH), warm terracotta on ecru, light + dark. Type **Space Grotesk**
  (display) + **Inter** (body). Logo mark + favicon in `src/brand` / `assets`.

## Legal `[PARTIAL — per-line flags]`
- **Code license:** `[CONFIRMED]` **AGPL-3.0-or-later** (org-wide; the SPDX id is in every
  `package.json`, and the full text is in each repo's `LICENSE`). Importing `@threadwick/core` carries
  its copyleft.
- **Privacy stance:** `[CONFIRMED]` local-first — work is stored in the user's browser, no account
  required by default, export is user-owned → minimal/no personal data collected.
- **Brand/IP:** `[DRAFT]` "Threadwick" name + marks © Threadwick. Trademark status TBD.
- **Privacy policy / Terms:** `[DRAFT]` formal documents TBD — owner to author before launch.
- **Legal entity / governing law:** `[DRAFT]` TBD.

---

### How this maps into `threadwick-core`
- `src/org/org.ts` — typed exports: `mission`, `vision`, `tagline`, `values`, `voice`, `audience`,
  `products`, `glossary`, `standards`, `brand`, `legal`. Exposed at `@threadwick/core/org`.
- `docs/org.md` — this document (front-matter + stable anchors), indexed by `AGENTS.md` / `llms.txt`.
- The glossary doubles as the controlled-vocabulary source the lint/validator can reference.

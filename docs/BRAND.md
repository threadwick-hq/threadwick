# Threadwick — brand & values

Source of truth for product identity, naming, and the fairness model, shared
between **Threadwick Studio** (this repo, `threadwick.com/studio`) and the
homepage (`Eiluviann/threadwick-home`, `threadwick.com`). They are one product:
nothing the app does may contradict this document, and identity changes here
must be flagged so the homepage follows.

## Brand & audiences

- **Spine line:** "Fair tools for fiber artists & makers."
- **Two first-class audiences:**
  - **Fiber artists** — design & publish patterns (creators / editing & publishing).
  - **Makers** — follow patterns and make projects (users).
- Built for artists & makers — **not investors or growth charts**.
- **Voice:** warm, plain-spoken, maker-friendly. No jargon, no hype, no
  urgency tricks.

## Naming & vocabulary

### Product names

- The brand/portal is **Threadwick** (`threadwick.com`); the app is
  **Threadwick Studio** (`/studio`). Lowercase "threadwick" wordmark.
- Formerly "stitchgrid" — do **not** reintroduce that name anywhere (UI,
  identifiers, docs, meta, comments). *Sole exception:* the legacy
  `localStorage` migration key in `src/core/store.ts`, which must keep reading
  old saves forward — deleting it would orphan user data.
- It's **Ravelry** — never "Raverly".

### Domain object hierarchy — use these names consistently

- **Project** — a collection of patterns plus shared resources. **One concept
  for both audiences:** artists fill a project with patterns they're designing;
  makers fill one with patterns they're making — progress-tracking simply
  applies when you're *making*. (Adopted resolution; if a distinct noun for the
  maker's tracked make is ever preferred, update both repos together.)
- **Pattern** — an individual design inside a project. Status:
  **Draft / Published / Outdated**.
- **Chart** — the stitch chart (the granny-square grid) inside a pattern,
  worked in **rounds**. Prefer **"chart"** over "graph" everywhere.
- **Shared resources** on a project: **yarns, links, notes, variations**
  (use these exact labels).

### Stitch terminology — support US **and** UK (firm convention)

Users switch stitch names between US and UK conventions; stay byte-consistent
with this mapping (UK runs "one taller"). Implemented in
`src/core/symbols.ts` (`stitchName` / `stitchAbbr`).

| Symbol        | US term                   | UK term             |
| ------------- | ------------------------- | ------------------- |
| open oval     | Chain (ch)                | Chain (ch)          |
| filled dot    | Slip stitch (sl st)       | Slip stitch (sl st) |
| cross         | Single crochet (sc)       | Double crochet (dc) |
| T             | Half double crochet (hdc) | Half treble (htr)   |
| T + 1 slash   | Double crochet (dc)       | Treble (tr)         |
| T + 2 slashes | Treble (tr)               | Double treble (dtr) |
| T + 3 slashes | Double treble (dtr)       | Triple treble (ttr) |

**Symbol drawing convention:** chain = open oval; slip stitch = filled dot;
sc = cross; hdc = T (vertical bar + top cap); dc/tr/dtr = T with 1/2/3
diagonal slashes, slashes running **top-left → bottom-right**.

## The fairness model — the app must never contradict this

**Free-first.** State it and enforce it:

- **Free, always:** designing, charting, organizing, and exporting; a free
  account; cloud **sync & backup**; sharing patterns; the follow-along viewer;
  and selling your own patterns via **license keys where you handle the
  transaction** (Threadwick takes nothing).
- **Paid — optional, artists only:** only when **Threadwick processes a sale
  for you** (the marketplace, or in-app "buy via a link"). Fees are **small,
  flat, transparent, shown up front**; the artist keeps the **large
  majority**; pricing **flexes with local spending power**.
- **Makers never pay Threadwick anything, ever.** They may pay an artist for a
  pattern; never a Threadwick fee or subscription.
- **No lock-in:** export anytime in open, portable formats; leave whenever.
- **No dark patterns:** no manipulative upsells, no engagement traps, no fake
  urgency, no selling user data.

## Access tiers (to prevent paywall mistakes)

- **No account:** full design / chart / organize / **export**, local-first. Free.
- **Free account:** adds sync across devices, cloud backup, share/publish
  links, follow-along progress sync. Still free.
- **Paid (artists only, optional):** the *only* paid surface — selling
  **through** the platform (marketplace, in-app buy-via-link). Makers never
  see a bill here.

**Rules that follow:** never paywall core tools or account/sync/backup;
selling is opt-in; license-key sales pay the artist directly with no
Threadwick cut; marketplace fees are transparent and artist-majority; makers
pay only the artist's price (no buyer-side platform fee).

## "No lock-in" with teeth — full data portability

Image export (SVG/PNG/PDF of the chart) is not enough. Provide a **full
library export *and* import** (projects, patterns, resources) in a
**documented open format** (JSON) so a user can take everything out and bring
it back. This operationally backs the no-lock-in promise. (Tracked: issue #63;
see also the data-ownership principle in `CLAUDE.md`.)

## Privacy & data posture (backs "we don't sell your data")

- Local-first by default; cloud is **opt-in**.
- Request the **minimum Ravelry OAuth scope** needed.
- Provide data **export** and account **deletion / takeout**.
- If analytics are added, use a privacy-respecting tool with **no invasive
  third-party trackers**.

## Billing / upsell UX rules (where fairness is most visible)

No confirm-shaming copy; no pre-checked add-ons; no countdown/urgency timers;
fees and "you won't be charged" shown up front; **cancellation as easy as
sign-up**.

## Visual identity (this repo is the source of truth — keep the homepage in sync)

- **Logo:** white glyph on a terracotta rounded square — favicon
  `viewBox 0 0 640 640`, `rx 144`, glyph scaled `0.66` about centre,
  fill `#c2603f`.
- **Palette:** primary `#c2603f`, link `#a64e30`; text `#21201c` / `#6b675f` /
  `#8a8275`; bg `#f6f4ef` / `#ffffff`; border `#e7e2d8` / `#efe9dd`;
  radius 8/6/10; soft warm shadows.
- **Type:** Space Grotesk (display/wordmark) + Inter (body).
- **A11y notes baked into usage:** white on `#c2603f` is ~4.17:1 — primary
  *buttons* (normal-size text) use the darker `#a64e30`; `#8a8275` fails AA
  on the page background (3.45:1) — use `#6b675f` for muted *text* and keep
  `#8a8275` for decorative/disabled only.

## Accessibility & responsive bar

Hold **WCAG AA** (4.5:1), semantic landmarks, keyboard nav,
`prefers-reduced-motion`; fully responsive **PC / tablet / mobile** including
**touch & Apple Pencil**.

## Roadmap — build each to honor the fairness model

Planned (the homepage lists these as "on the hook"; move items to real
features there when they ship here):

- Fully responsive (PC/tablet/mobile); touch & Apple Pencil support.
- Full **Ravelry** integration — auto-sync projects, patterns, progress.
- Pattern publishing — share via a link.
- Advanced exports — all-in-one, customizable, ready-to-use PDF with full
  pattern data; open/portable.
- Pattern **licensing** — license keys; **buyer pays the creator directly**;
  redeem in-app for permanent access; persists even after the marketplace
  exists; Threadwick takes nothing here.
- **Marketplace** — **optional**; platform handles payment; artist keeps the
  majority; makers never pay a platform fee.
- Improved crochet charting — show **exactly where each stitch is worked**.
- State-of-the-art pattern viewer; interactive **follow-as-you-go** viewer —
  all devices incl. mobile; tracks project progress.
- **Projects** — multi-pattern, auto-tracking, notes; synced to Ravelry.
- **Interactive charts** — user-customizable (line weight, your yarn colors,
  your view); not static images.
- **Fingerprinting** — invisible per-copy fingerprint in exports so an artist
  can trace an unauthorized re-upload back to the buyer. **Artist protection,
  not DRM:** be transparent that exports are fingerprinted; the fingerprint
  identifies the **copy/purchase** for the artist's own enforcement, **not**
  unnecessary buyer PII — protect artists without surveilling makers.
- **API integration** — connect the artist's systems or Ravelry; generate
  personalized, fingerprinted PDFs.

## Cross-repo sync & roadmap honesty

- The Studio is the **source of truth for identity** (logo/tokens/fonts) — if
  it changes them, update the homepage.
- Don't show **fake/unavailable** features in-app (the homepage marks them
  "planned"). When a roadmap feature **ships**, update the homepage to move it
  from "What's on the hook" into a real feature.
- Keep pricing wording consistent across both repos. The homepage states
  **bold principles, no hard numbers** — if real numbers appear in-app, update
  the homepage to match.

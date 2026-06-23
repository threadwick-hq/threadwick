# Threadwick Studio — redesign specification

Status: **design complete, ready to build.** Produced through a collaborative design session; every surface below is locked unless marked *deferred*. This document is the engineering-facing source of truth — pair it with [`product-map.html`](./product-map.html) for the one-page information architecture.

---

## 0. What Threadwick is, and the thesis

Threadwick is a warm, **free, browser-based, local-first** home for fiber artists (crochet-focused, expanding across crafts). It is **three fronts over one object — the Pattern — across its lifecycle**, not three apps:

- **Studio** — for *artists*: design a pattern (chart designer).
- **Marketplace** — for *everyone*: discover, buy, sell, share.
- **Viewer / follow mode** — for *makers*: make a pattern, round by round.

The redesign unifies these into **one shell** the same person moves through fluidly. Two audiences are served at once and never siloed: **artists** (design) and **makers** (make) — roles are a *mode*, not an account type.

### Through-lines (apply everywhere)

- **One object, one lifecycle:** Design → Publish → Discover → Buy/Make → Project → Follow. The same `Pattern` flows through all surfaces; it is never re-modelled.
- **Local-first & decouplable:** everything works offline / in a private instance. The **Marketplace is the networked layer** (buy/sell/sync) and can be removed entirely — the app must still feel complete with just your own work.
- **Ravelry as the metadata backbone:** yarns, tools, categories, and pattern attributes draw from Ravelry's data, so filtering is rich.
- **Maker-friendly:** makers skew older, mobile-heavy, mixed tech comfort. Surfaces stay simple, big-target, glanceable; complexity is progressive and opt-in.
- **Accessibility:** WCAG 2.1 AA, never colour-only, full keyboard, reduced-motion.
- **Craft is an *inclusion* filter**, never exclusion (a multi-craft project still appears when you scope to one of its crafts).

### Visual / interaction principles (locked)

- **Content tiles** use white background + a hairline border. **Gray fill is reserved for image placeholders** so "image goes here" reads distinctly from "this is a card."
- **Accent (warm terracotta)** is reserved — primary actions, the active nav item, progress fills, small status dots. Not sprinkled on every surface.
- **Patterns and projects are represented by photos**, never by a chart snapshot.
- **UWD (ultra-wide) rule, app-wide:** fixed-width chrome + content **capped and centered**; excess becomes calm margin. Never stretch line-lengths or bloat focal art. Focal art's escape hatch for "bigger" is **zoom**, not auto-stretch.

---

## 1. Shell & navigation

A **wide, always-expanded left sidebar** (no contextual roll-up — every section's items are always visible). Top → bottom:

1. **Craft picker** (see §2) — occupies the top slot.
2. **Home** (standalone row).
3. **Workbench** — `Patterns` (your designs) · `Projects` (your makes).
4. **Library** — `Patterns` (saved + bought) · `Yarns` · `Tools`.
5. **Marketplace** — `Home` · `Browse` · `Following` · `Free` · `Wishlist`.
6. **Creator Insights** *(conditional — only if you have ≥1 published pattern; **deferred**, see §8)*.
7. **Footer (pinned):** local-status / account ("Saved in this browser").

Notes:
- "Patterns" appears under both Workbench (designs you author) and Library (patterns you've saved/bought) — the parent disambiguates; no abstraction layer.
- Section order encodes the user's day: **create → stash → discover → business.**
- Sub-items carry counts on your own stuff (Workbench/Library) and on Following/Wishlist.
- **Topbar:** global search (⌘K, spans your library *and* the marketplace) + a **notifications bell** + Import / New.
- **Mobile (≤ ~860px):** the sidebar collapses to a fixed **bottom tab bar** (Home · Library · Marketplace · Create · Account).

### Notifications

Top-bar **bell** + unread count → a **unified inbox** with a light filter `All · Activity · Shop` (the `Shop` filter only appears for published creators). Events: *maker side* — a pattern you own has a newer version, a designer you follow published, replies; *creator side* — sales, reviews, new followers, payouts. Mostly the networked layer (quiet offline). Update signals also ride contextually on the item itself; the bell is the global log.

---

## 2. Craft picker — a *mode*, not just a filter

A picker at the top of the sidebar that scopes the **whole studio** to a craft.

- Default **"All my crafts."**
- The dropdown lists **only the crafts you work with**, plus **"+ add craft."**
- Fixed taxonomy (expanding toward Ravelry coverage) — a known set so we can ship craft-specific tooling.
- It scopes content (Library, Marketplace, Home) **and** defaults craft-specific tools and terminology (stitch symbols, US/UK terms, the project tool picker).
- **Inclusion semantics:** picking "Crochet" scopes/defaults but never hides things you can still reach via search; a multi-craft project that includes crochet still appears.

In the **pattern/project interior** (a drill-in), this picker slot is replaced by the object's identity tile (see §3, §4) with **no layout shift**.

---

## 3. Home

Single-column, **personal-first**, returning-user (onboarding is a separate later effort), craft-scoped. Top → bottom:

1. **Greeting** + a one-line subtitle.
2. **Quick start** — a slim chip row: `New pattern · New project · Import · Browse marketplace` (both roles' entries, never gated).
3. **Continue** — the heart. A **content-width** "pick up where you left off" **lead card** (your single most-recent active thing, with the right verb), then a **recents shelf** below it. Each recent's timestamp carries its state in plain language ("Edited 9 hours ago" = designing, "Worked on 2 days ago" = making, "Saved 4 days ago" = saved).
4. **One** second block — **discovery** when the marketplace is on and has suggestions ("Because you're making {X}", trending, etc.), otherwise a **larger library peek**. Bigger photo cards, good aspect ratio.
5. **Creator teaser** — a calm, neutral card (only if published): "Your shop · N sales this week · …".
6. **Local-first line** to close.

Decouple test: marketplace off → discovery + creator teaser drop, the rest stands and still feels complete.

---

## 4. Pattern interior

Opening a Workbench pattern is a **drill-in takeover**: the global nav collapses to a breadcrumb, and the pattern's own rail + content fill the workspace. **Role-aware** — the same pattern renders an **edit** hub (owner/artist) and a **view** surface (maker/buyer).

### 4.1 Rail (edit mode)

- **Top:** pattern-details tile = icon + title + **Private/Public pill** + a **settings cog**, occupying the craft-picker slot (no layout shift). Breadcrumb `← Workbench / Patterns` just beneath.
- **Overview** — explicit first item.
- **Components** — each expands to its artifacts: `Chart` / `Written instructions` / `Schematic`. `+ Add component`.
- **Materials & reference** — Yarns & hooks · Tutorials · Stitches · Notes · Variations.
- **Pinned version tile (bottom):** the version **switcher** + a contextual action — **Publish pattern** (when private) / **Publish version** (when a draft exists) / **New draft** (when none) — plus **Remix** (always).

### 4.2 Overview screen (edit mode)

Title + a state pill ("Published · editing v4"), an **editable description**, finished-object **photos**, **key-facts tiles** (difficulty · components · yarn · hook · gauge · rounds — white + hairline border), and a navigable **"what's inside"** (Chart & written instructions, Materials…).

### 4.3 Versions & publishing (model)

- A pattern is **published or private — whole-pattern**, never a mix.
- **Versions** are a **linear history**; at most **one working draft** sits on top of the published history.
- Creating a new version on a published pattern → it's a **draft** (yours only) → edit → **Publish version** releases it.
- **Buy once = yours forever, updates included, never re-charged.** When a pattern you own gets a new version, you stay on your last-viewed version with a **"newer version available"** banner; you can switch versions by opening the pattern.
- **Unpublish** removes it from the marketplace (no longer buyable/listed) but **keeps it in the library of everyone who already owns it.**
- **Remix** = duplicate into a **new, private, editable** pattern of your own, carrying **lineage** ("remixed from {pattern} · {designer}").

### 4.4 View mode (maker decision surface)

The same screen, re-skinned to answer *"what is this — do I want to make it?"* — **not** the round tracker.

- Rail: the details tile shows **designer attribution + a save/bookmark** and an owned/price pill (no cog); breadcrumb reflects entry (`← Marketplace / Browse`); artifacts are **read-only previews** (preview-only until owned, for paid); the bottom tile is a quiet version switcher.
- Main: **gallery · highlighted creator · price + actions** as the first row. Creator shows **full name primary + @handle secondary** (+ followers · Follow · "more by"). Rating links to a reachable **Reviews** section. Description, key facts, viewable "what's inside".
- Primary action: **Start making** (free/owned) / **Buy · $X** (paid) / **Remix** (free/owned). **Start making creates a Project in the background** — no orphaned making sessions; paid is buy-then-start.

### 4.5 Pattern quality checks

One component, two faces — **EDIT:** an artist *audit* (present = checked; missing = a **muted "add to strengthen", never a red penalty**). **VIEW:** the same array as **"what's included"** signals for makers. Two tiers: a **minimum floor** that gently gates publishing (≥1 artifact [chart or written] · ≥1 photo · materials + gauge · difficulty) + everything else **optional-but-rewarded** (schematic · video · multiple sizes · US&UK terms · stitch guide…). **Reward, never penalize.**

---

## 5. Project interior

A **make**. Mirrors the pattern interior's anatomy (drill-in takeover; identity tile + state pill + cog; breadcrumb; Overview first; pinned status tile).

- **Rail:** `Overview` → **Patterns** (the make can hold **several, across crafts**, each with a source tag: threadwick / Ravelry link / blog URL / your PDF; each opens the **follow view**; per-pattern progress) → **Materials & notes** (`Yarns · Tools · Notes · Photos`) → **`+ Add section`** (custom entity types — a power-user opt-in; the defaults keep beginners on rails) → **pinned status tile** = the **state** selector + overall (aggregated) progress + **Continue making**.
- **States** (sync to Ravelry): `Draft → Hibernating · In progress → In progress · On hold → Hibernating · Done → Finished · Frogged → Frogged`. Ravelry→Threadwick "Hibernating" defaults back to *On hold*. Each state has a quiet colour (gray/blue/amber/green/red).
- **Overview screen:** title + state, progress photos, "patterns in this make" (per-pattern progress + Continue/Open), key-facts tiles, "yarns & tools used" with **"from stash"** tags.
- **Yarns/Tools picker:** defaults to your **owned stash**; search spans the **whole Ravelry DB**; adding a non-stashed item **asks whether to add it to your stash** (keeps the Library in sync with what you actually use).

---

## 6. Follow view — the making surface

The Viewer. A **focused, phone-first** sub-mode entered by opening a pattern inside a project. **The most important surface in the app.** Locked across phone · tablet (both orientations) · desktop · ultra-wide.

### Anatomy (phone)

- Slim focus bar: back · pattern name · **keep-awake** · overflow.
- **Mode selector** (primary): `Per-row · Pattern · Granular`.
- **Big interactive chart pane** (zoom · tap a stitch to inspect). Completed rounds solid, current round lit, later rounds **ghosted**.
- Small **informative counter pills** (stitches / repeats) — display-only.
- **Instruction box** (hairline border), always split into **Start · Round · Finish** with a horizontal rule between sections. Stitch tokens emphasised, connectors italic, a light-gray "why" comment under any line that has one. Each section has a small **check** that *accordions it away* once done.
- **Footer:** an embedded **progress bar over** a single big action + an **Undo** (one step).

### The one-action model

Manual stitch/repeat counters are **retired**. The single big action drives the counting at the granularity the maker picks via the mode (remembered per-project; the pattern can suggest a default):

- **Per-row** → one tap = `Round done`; the whole round is shown, no counting.
- **Pattern-based** → the round is split into bite-size chunks (corners + repeated sides); one tap = `Bite done` → next bite.
- **Granular** → cluster-by-cluster; one tap = `Cluster done`, which ticks the repeat then rolls into the next instruction.

### Responsive

- **Tablet landscape / desktop:** chart and the instruction panel **side-by-side** (instructions always open).
- **Tablet portrait:** the same pieces **stacked**, roomier.
- **Desktop = immersive** (global nav recedes → a slim "back to project" bar); the two-pane **stage caps ~1040px and centers**. On ultra-wide the stage centers and excess becomes calm margin.

### Open behaviours (to resolve in build)

- The chart should **follow the current bite/cluster** position in the finer modes (not just the round).
- **External patterns** (Ravelry link / PDF) lack structured data → fall back to a plain round checklist / open the source.

---

## 7. Library

Your **collection**, in the normal shell (sidebar + main), craft-scoped. Three sub-screens.

- **Patterns** — your saved + bought (free & paid). The pattern-card grid, filtered to what you own/saved, with the "newer version available" nudge on owned ones.
- **Yarns (stash):** a **grid of yarn swatch cards** (from the Ravelry DB) — swatch/photo + name (brand · line) + weight + **quantity** (skeins/grams) + "used in N projects". Weight filter chips; grid/list toggle; "+ Add yarn." Tracking is a **friendly middle** — precise yardage + deduct-on-use are *optional*. **Bridges:** a yarn's detail → "used in N projects" + **"find patterns for this yarn / weight"** (into the marketplace), so the stash is *generative*, not a dead inventory.
- **Tools:** a **tap-to-own size matrix** (efficiency over finesse, Ravelry-style) — just **type + size** (no material/quantity/brand). Owned cells fill terracotta; tap to toggle. Craft-scoped (crochet → hook sizes · knit → needle sizes · all-my-crafts → both sections). The owned set powers the project tool picker's "owned-only" filter.

---

## 8. Marketplace

Native but **decouplable** behind a capability flag (offline/private app stays complete). Two screens.

- **Home** = a curated storefront: a **search**, then curated rows (Popular · Free · New · From designers you follow · "because you're making {X}") + a designer spotlight. **No filter bar, no editor's-pick hero** — curation leads straight in. Cards here drop the "Community" badge (all market) and lead with photo + price + designer + rating.
- **Browse** = one **"see-everything" filterable view**: the full catalogue grid + a **filter header** (a light *secondary-header* facet row, not a heavy bar) where **Category is the first filter**, then Weight · Difficulty · Price · **"more filters"** (the full Ravelry set), Sort on the right. **Applied filters pin to the front**, clear to reset. Craft-scoped. *No category tiles or drill-down* — a tile-grid + subcategory drill-down was prototyped and dropped for this flatter view. The filter header lives on Browse only; a Home shelf "see all" or a sidebar `Following`/`Free` deep-links into a pre-filtered Browse.

The single unified pattern card and the in-place "flip" (Make-it/Buy a market card → it becomes a local working copy in your Library/Making) tie the marketplace to the rest of the app.

---

## 9. Deferred — Creator Insights

A **conditional** top-level destination, shown only if you have ≥1 published pattern (free or paid). Beginner-readable at-a-glance + advanced depth via progressive disclosure. Planned sub-items: `Dashboard · Listings · Sales · Stats · Payouts`. **Intentionally deferred to a later project phase** — the destination + the conditional rule stand; the interior is not yet designed.

---

## 10. Controlled vocabulary

- **Pattern** — the authored design (Workbench root). Published or private; linear versions; ≤1 draft.
- **Component** — a worked unit of a pattern (`motif | panel | part | assembly`; optional for single-piece). Canonical term — not "motif/piece".
- **Artifact** — a view under a component: `Chart | Written instructions | Schematic`.
- **Project** — a *make*; references one or more patterns (across crafts/sources), plus yarns, tools, notes, photos, custom entities.
- **Material / Yarn / Tool / Tutorial / Stitch / Note / Variation** — reference entities; US/UK stitch terminology supported.
- **Workbench** = what you *create & make*. **Library** = what you *own & stash*.

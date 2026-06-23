# Threadwick Studio redesign — handoff

This folder is the **design handoff** for the Threadwick Studio redesign: a full rework of the Studio shell (`apps/studio`) that unifies a maker's library and the marketplace into one coherent, local-first product, designed for **both artists (design) and makers (make)** in a single app.

It was produced through a collaborative design session and is **complete and ready to build** (one area, *Creator Insights*, is intentionally deferred to a later phase).

## Contents

| File | What it is |
|---|---|
| [`spec.md`](./spec.md) | The full design specification — the source of truth. Every surface, behaviour, and the locked decisions, organised for engineering. |
| [`mockups/`](./mockups/index.html) | Static, browser-viewable mockups of every locked screen. Open [`mockups/index.html`](./mockups/index.html) for the gallery. |
| [`product-map.html`](./product-map.html) | The one-page information architecture + object lifecycle, on a single diagram. Open in a browser. |

## Mockups

[`mockups/index.html`](./mockups/index.html) is a gallery linking a standalone HTML file per locked screen, all sharing one stylesheet (`mockups/shared.css`) in Threadwick's warm Brick & Ecru light palette. Gray blocks are image placeholders; they are **visual references for layout and hierarchy, not production markup**.

- **Home & nav** — Home, full sidebar.
- **Interiors** — pattern overview (edit), pattern view mode, project hub, Library → Yarns.
- **Follow view** — the round-by-round work mode at four breakpoints: phone, tablet portrait, tablet landscape, desktop/ultrawide (with the UWD cap-and-centre rule).
- **Marketplace** — home (storefront) and browse (one filterable view).

## The shape, in one breath

A wide, always-expanded sidebar with a **craft-mode picker** scoping everything, and these destinations:

- **Home** — personal-first: greeting → quick-start → *Continue* (lead + recents) → one discovery/library block → creator teaser.
- **Workbench** — your `Patterns` (design: edit/view/versions/publish/quality) and `Projects` (make).
- **Library** — `Patterns` (owned/saved) · `Yarns` (stash) · `Tools` (tap-to-own size matrix).
- **Marketplace** — `Home` (curated) + `Browse` (one filterable view) · Following · Free · Wishlist. Decouplable.
- **Creator Insights** — conditional; **deferred**.

The connective tissue is **one object (the Pattern) across one lifecycle**: Design → Publish → Discover → Buy/Make → Project → **Follow** (the round-by-round making view — the most important surface, designed phone-first across every breakpoint, with a clean ultra-wide rule).

## Status & next step

- **Design:** complete and locked (see `spec.md`).
- **Build:** not started — this handoff intentionally contains the *design*, not the implementation. (An earlier "Two Front Doors" prototype was explored in the legacy `threadwick-home` repo — now superseded by `apps/web` for marketing — and that prototype is **superseded** by this spec for the Studio.)
- **Deferred:** the Creator Insights interior (a later phase).

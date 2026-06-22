# Threadwick — design principles

The judgment calls tokens can't encode. When a decision isn't covered by a token, a type, or a lint
rule, decide in this order.

1. **Warm, calm, paper.** Cozy and tactile, never corporate, loud, or gamified. Terracotta on ecru;
   soft shadows; generous quiet space. If it feels like a SaaS dashboard, it's wrong.
2. **Symbols, not colour.** Meaning is carried by shape, icon, text, and crochet **stitch symbols** —
   never colour alone. This is what makes charts colour-blind-safe. Keep it everywhere; semantic
   states always ship an icon or label.
3. **8-px rhythm.** Everything lays out on the 8-px grid (4 for intra-component gaps, 2 for
   hairlines). Type is the deliberate exception. Reach for a `space` key, never a raw pixel.
4. **One app, two modes.** Studio (edit) and Viewer (follow) are modes of one product over one
   `Pattern`, not separate apps. Every surface shares the shell and reads as one home. Maker ↔ artist
   is a mode, not an account type.
5. **AA, always.** WCAG 2.1 AA is non-negotiable; the audience skews older. Visible focus, full
   keyboard, ≥44-px touch targets, real labels, `prefers-reduced-motion`, 200 % zoom. Accessibility
   is a property of the shared tokens and components, not a per-screen afterthought.

**Per-component a11y gate** — every shared component must be: keyboard-operable · visibly focusable ·
labelled · AA-contrast · never colour-only · reduced-motion-safe · screen-reader-checked.

**Voice:** warm, encouraging, plain — a knowledgeable friend at a craft circle. Short sentences,
sentence case, craft-native vocabulary (US/UK). No hype, no jargon, no dark patterns. (See
`@threadwick/org`.)

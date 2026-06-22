/**
 * Threadwick org canon — the single importable source of org-wide knowledge.
 * Mirrors docs/org.md. Copy is imported, never hand-typed (e.g. the marketing site's
 * meta description and hero pull from `mission` / `tagline`).
 *
 * `status: 'confirmed'` = established project fact. `status: 'draft'` = proposed by an
 * agent; the OWNER must confirm or replace before it is treated as final. Mission, vision,
 * values, voice, and legal are DRAFT pending owner sign-off.
 */
export type CanonStatus = 'confirmed' | 'draft';

export interface Canon<T> {
  status: CanonStatus;
  value: T;
}

const confirmed = <T>(value: T): Canon<T> => ({ status: 'confirmed', value });
const draft = <T>(value: T): Canon<T> => ({ status: 'draft', value });

// ── Mission / vision / tagline ───────────────────────────────────────────────
export const mission = confirmed(
  'A free home for fiber artists to design, keep, and share their patterns — and for makers to follow them.',
);

export const vision = confirmed(
  "Every fiber artist's patterns, charts, yarns, and notes in one place they truly own — no account, no lock-in — and any maker able to open a pattern and make it, on any device.",
);

export const tagline = confirmed('A home for fiber artists.');

// ── Values ───────────────────────────────────────────────────────────────────
export interface Value {
  name: string;
  description: string;
}
export const values = confirmed<Value[]>([
  {
    name: 'Craft-first',
    description:
      'We speak the craft (stitches, symbols, US/UK terms) and build tools shaped to how fiber artists actually work — not generic software bent to fit.',
  },
  { name: 'Warm & calm', description: 'Cozy and paper-like, never corporate, loud, or gamified.' },
  {
    name: 'Yours, and local-first',
    description:
      'Your work lives in your browser; free, no account, export any time, no lock-in.',
  },
  {
    name: 'Accessible to everyone',
    description: 'WCAG AA, every device, every age and ability; never colour-only.',
  },
  { name: 'One coherent home', description: 'Every surface feels like one app.' },
]);

// ── Voice & tone ─────────────────────────────────────────────────────────────
export const voice = confirmed({
  summary:
    'Warm, encouraging, plain. Talk like a knowledgeable friend at a craft circle, not a SaaS landing page. Short sentences, sentence case, craft-native vocabulary (with US/UK). Encourage beginners; respect experts.',
  dos: [
    'Short sentences, sentence case.',
    'Craft-native vocabulary (with US/UK terms).',
    'Encourage beginners; respect experts.',
    'To makers, prefer "pattern / square / round" over abstract product terms.',
  ],
  donts: ['No hype.', 'No dark patterns.', 'No jargon.'],
});

// ── Audience ─────────────────────────────────────────────────────────────────
export const audience = confirmed({
  primary: {
    name: 'Fiber artists',
    role: 'Pattern/chart designers',
    surface: 'the full Studio editor',
  },
  secondary: {
    name: 'Makers',
    role: 'Follow patterns (do not use the editor)',
    surface: 'the read-only viewing / follow mode',
    notes: 'Skews older, mobile-heavy, mixed tech comfort.',
  },
});

// ── Products & surfaces ──────────────────────────────────────────────────────
export interface Surface {
  name: string;
  audience: string;
  description: string;
}
export const products = confirmed<Surface[]>([
  {
    name: 'Studio',
    audience: 'artists',
    description: 'The chart designer (project page → editor); design the pattern. Local-first / no-account.',
  },
  {
    name: 'Marketplace',
    audience: 'everyone',
    description: 'Discover · buy/sell · share; the home of the publishing/consumption layer.',
  },
  {
    name: 'Viewer',
    audience: 'makers',
    description: 'Read-only follow mode (big chart + round tracker); make the pattern.',
  },
  {
    name: 'threadwick.com',
    audience: 'everyone',
    description: 'Marketing front door that routes into all three.',
  },
  {
    name: 'threadwick-core',
    audience: 'agents/developers',
    description: 'Shared design system, org knowledge, types, and domain primitives (the base).',
  },
]);

// ── Controlled vocabulary / glossary ─────────────────────────────────────────
export const glossary = confirmed<Record<string, string>>({
  Project: 'A make (maker plane); references one or more Patterns.',
  Pattern: 'The authored design (the Studio sidebar root).',
  Component:
    'A worked unit of a pattern (motif | panel | part | assembly; optional/implicit for single-piece). Use "Component," not "motif/piece".',
  Artifact: 'A view under a Component: Chart | Written instructions | Schematic.',
  Material: 'yarn | hook | needle | notion.',
  Tutorial: 'project | technique.',
  Stitch: 'special | abbreviation.',
  Note: 'general | gauge | care | safety | colorchange | stuffing.',
  Variation: 'size | colorway | yarn-weight | technique | difficulty.',
});

// ── Standing decisions / standards ───────────────────────────────────────────
export const standards = confirmed<string[]>([
  'Accessibility: WCAG 2.1 AA, non-negotiable. Never colour-only (crochet symbols carry meaning).',
  'Responsive: flawless on all devices; one codebase; panes stack on phone.',
  'Colour: authored in OKLCH (Brick & Ecru); sRGB hex is a legacy fallback only.',
  'Spacing/sizing: 8-px grid (4-px sub-grid for intra-component gaps).',
  'One design language: enforced via threadwick-core (single source + lint + CI), not by discipline.',
  'Agent-first: docs + system optimised for AI consumption + machine-enforced correctness.',
]);

// ── Brand ────────────────────────────────────────────────────────────────────
export const brand = confirmed({
  name: 'Threadwick',
  wordmark: 'threadwick',
  palette: 'Brick & Ecru',
  fonts: { display: 'Space Grotesk', body: 'Inter' },
  org: 'threadwick-hq',
  domain: 'threadwick.com',
  npmScope: '@threadwick',
});

// ── Legal ────────────────────────────────────────────────────────────────────
// Per-fact status: the licence + privacy stance are CONFIRMED; trademark, a formal privacy
// policy / ToS, and the legal entity remain DRAFT pending owner action.
export const legal = {
  codeLicense: confirmed('AGPL-3.0-or-later'),
  privacyStance: confirmed(
    "Local-first — work is stored in the user's browser, no account required by default, export is user-owned → minimal/no personal data collected.",
  ),
  brandIp: draft('"Threadwick" name + marks © Threadwick. Trademark status TBD.'),
  privacyPolicy: draft('Formal privacy policy + terms of service TBD — owner to author before launch.'),
  entity: draft('TBD — legal entity + governing law.'),
} as const;

/** The full org canon as one object. */
export const org = {
  mission,
  vision,
  tagline,
  values,
  voice,
  audience,
  products,
  glossary,
  standards,
  brand,
  legal,
} as const;

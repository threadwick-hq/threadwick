import {
  Code,
  Computer,
  EditPencil,
  Eye,
  Fingerprint,
  Folder,
  Key,
  Link,
  OpenBook,
  Page,
  Palette,
  Play,
  RefreshDouble,
  Shop,
} from 'iconoir-react';

/** Who a planned feature is for — rendered as a small chip on each tile. */
export type Audience = 'studio' | 'artists' | 'you';

export const AUDIENCE_LABEL: Record<Audience, string> = {
  studio: 'Studio',
  artists: 'For artists',
  you: 'For makers',
};

/** Bento tile size on desktop (clamped down on tablet/mobile via CSS). */
export type TileSize = 'hero' | 'wide' | 'small';

/** Visual accent: 'ink' = dark tile, 'wash' = terracotta-tinted, default white. */
export type TileAccent = 'ink' | 'wash' | undefined;

export interface PlannedFeature {
  icon: typeof Play;
  audience: Audience;
  size: TileSize;
  accent?: TileAccent;
  title: string;
  body: string;
}

/**
 * Planned features ("What's on the hook"), in display order — which is also
 * the mobile stacking order, so it runs most- to least-flagship.
 * Desktop spans are planned to fill 4-column rows exactly (24 cells / 6 rows).
 */
export const PLANNED_FEATURES: PlannedFeature[] = [
  {
    icon: Play,
    audience: 'you',
    size: 'hero',
    accent: 'ink',
    title: 'Follow along, stitch by stitch',
    body: 'An interactive viewer that walks you through a pattern step by step — on any device, even your phone — and keeps track of your progress as you go.',
  },
  {
    icon: EditPencil,
    audience: 'artists',
    size: 'wide',
    title: 'Made for tablet and pencil',
    body: 'Full touch and Apple Pencil support, so you can chart with your hands — the way you actually sit with your yarn.',
  },
  {
    icon: RefreshDouble,
    audience: 'studio',
    size: 'small',
    title: 'Plays nicely with Ravelry',
    body: 'Projects, patterns and progress sync automatically with your Ravelry account.',
  },
  {
    icon: Computer,
    audience: 'studio',
    size: 'small',
    title: 'Phone, tablet, PC',
    body: 'The whole studio, fully responsive on every screen.',
  },
  {
    icon: Shop,
    audience: 'artists',
    size: 'wide',
    accent: 'wash',
    title: 'A marketplace that’s fair to fiber artists',
    body: 'A completely optional way to sell: publish your patterns for others to browse and buy, we handle the payments — and you keep most of the revenue.',
  },
  {
    icon: Key,
    audience: 'artists',
    size: 'wide',
    title: 'Sell directly to your buyers',
    body: 'Issue license keys for your patterns. Buyers pay you directly — the money goes straight to you — and redeem their key in the app for permanent access. This stays, even after the marketplace arrives.',
  },
  {
    icon: Fingerprint,
    audience: 'artists',
    size: 'wide',
    title: 'Every copy carries an invisible signature',
    body: 'Exports are fingerprinted invisibly. If a pattern turns up somewhere it shouldn’t, inspect the file and see exactly which copy it came from — protection for you, with no DRM hassle for honest makers.',
  },
  {
    icon: Code,
    audience: 'artists',
    size: 'wide',
    title: 'An API for your workflow',
    body: 'Plug Threadwick into your own systems or Ravelry, and generate personalized, fingerprinted PDFs for every buyer — automatically.',
  },
  {
    icon: Eye,
    audience: 'artists',
    size: 'wide',
    title: 'See exactly where each stitch lands',
    body: 'Charts that show precisely what you’re stitching into — the thing advanced patterns always leave out.',
  },
  {
    icon: Page,
    audience: 'artists',
    size: 'small',
    title: 'A PDF that’s ready out of the box',
    body: 'Exports with all your pattern data, beautifully laid out and customizable.',
  },
  {
    icon: Link,
    audience: 'artists',
    size: 'small',
    title: 'Publish with a link',
    body: 'One link, and anyone can open your pattern.',
  },
  {
    icon: OpenBook,
    audience: 'artists',
    size: 'small',
    title: 'Your patterns, at their best',
    body: 'A best-in-class pattern viewer that sets your work apart.',
  },
  {
    icon: Folder,
    audience: 'you',
    size: 'small',
    title: 'Projects that track themselves',
    body: 'Multi-pattern projects with notes and automatic tracking, synced to Ravelry.',
  },
  {
    icon: Palette,
    audience: 'you',
    size: 'wide',
    title: 'Charts you can shape',
    body: 'Adjust line weight, use your own yarn colors, customize your view. Your charts are no longer static images — you choose how you see them.',
  },
];

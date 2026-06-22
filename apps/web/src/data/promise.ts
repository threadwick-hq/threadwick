import { Community, Gift, HandCash, LockSlash } from 'iconoir-react';

export interface Pledge {
  icon: typeof Community;
  title: string;
  body: string;
}

/**
 * Threadwick's core promise — bold principles, deliberately without hard numbers.
 * Message hierarchy matters here: free comes first; fees exist ONLY for artists
 * who opt in to selling on/through the platform. Selling your own work outside
 * Threadwick is free by design.
 */
export const PLEDGES: Pledge[] = [
  {
    icon: Community,
    title: 'Built for fiber artists & makers',
    body: 'Made by and for the people who design patterns and the people who make from them. Every decision starts with you — not growth charts.',
  },
  {
    icon: Gift,
    title: 'Free to make, always',
    body: 'The studio is free to use: design, chart, organize and export without paying. Sell your work yourself, outside Threadwick, and we never take a cent — that’s by design.',
  },
  {
    icon: HandCash,
    title: 'You keep what you earn',
    body: 'Selling through Threadwick is entirely optional. If you choose it, fees are small, flat and shown up front, you keep the large majority — and pricing flexes with where you live and what you can spend.',
  },
  {
    icon: LockSlash,
    title: 'No lock-in, no tricks',
    body: 'Your work is yours — export it anytime in open formats and leave whenever you like. No manipulative upsells, no engagement traps, no selling your data.',
  },
];

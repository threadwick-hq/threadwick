import { CloudUpload, DesignNib, Folder, Lock, PageEdit, QrCode } from 'iconoir-react';

export interface Feature {
  icon: typeof Folder;
  title: string;
  body: string;
}

/**
 * Maker-friendly feature copy (no software jargon). Each card pairs an Iconoir
 * glyph with a warm, plain-spoken benefit.
 */
export const FEATURES: Feature[] = [
  {
    icon: Folder,
    title: 'Everything in one place',
    body: 'Keep the patterns, yarns, links and notes for a project together, so nothing gets lost between makes.',
  },
  {
    icon: PageEdit,
    title: 'Drafts and versions',
    body: 'Tinker freely. Keep drafts, mark a pattern finished, and come back to an earlier version whenever you like.',
  },
  {
    icon: QrCode,
    title: 'Print and share',
    body: 'Print clean, readable PDFs, save your charts as images, and share a pattern with a quick QR link.',
  },
  {
    icon: Lock,
    title: 'Yours and private',
    body: 'Threadwick runs right in your browser. Your projects stay with you — private by default, nothing to install.',
  },
  {
    icon: CloudUpload,
    title: 'Always free',
    body: 'Use it free with no account. Sign in when you want to sync, back up, and reach your work across devices.',
  },
  {
    icon: DesignNib,
    title: 'Symbols you already know',
    body: 'Charts are drawn with the standard crochet symbols, so anyone who reads patterns can follow along.',
  },
];

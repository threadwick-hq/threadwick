/**
 * contrast.ts — shared WCAG contrast math + token audit, used by both check-contrast.ts
 * and validate.ts. Converts the OKLCH source of truth → linear sRGB → WCAG relative
 * luminance. OKLCH `L` is perceptual lightness, NOT WCAG luminance, so contrast must be
 * verified in sRGB regardless of authoring space.
 */
import { readFileSync } from 'node:fs';

export type Triple = [number, number, number];
export type Mode = 'light' | 'dark';

const TW = 'com.threadwick';

/** OKLCH → linear sRGB (OKLab matrices). Returns linear-light RGB for WCAG luminance. */
export function oklchToLinearSrgb([Lp, C, H]: Triple): [number, number, number] {
  const hr = (H * Math.PI) / 180;
  const a = C * Math.cos(hr);
  const b = C * Math.sin(hr);
  const l_ = Lp + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = Lp - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = Lp - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

export function luminance(t: Triple): number {
  const [r, g, b] = oklchToLinearSrgb(t).map(clamp01);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function ratio(a: Triple, b: Triple): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

export interface Pair {
  fg: string;
  bg: string;
  min: number;
  note: string;
}

/** Key text + UI pairs that must clear AA in both modes. */
export const PAIRS: Pair[] = [
  { fg: 'text', bg: 'bgLayout', min: 4.5, note: 'body on page' },
  { fg: 'text', bg: 'bgContainer', min: 4.5, note: 'body on surface' },
  { fg: 'text', bg: 'bgElevated', min: 4.5, note: 'body on cream bar' },
  { fg: 'textSecondary', bg: 'bgLayout', min: 4.5, note: 'secondary on page' },
  { fg: 'textTertiary', bg: 'bgLayout', min: 4.5, note: 'tertiary on page' },
  { fg: 'textTertiary', bg: 'bgContainer', min: 4.5, note: 'tertiary on surface' },
  { fg: 'link', bg: 'bgLayout', min: 4.5, note: 'link/accent on page' },
  { fg: 'onPrimary', bg: 'primary', min: 4.5, note: 'text on primary button' },
  { fg: 'focus', bg: 'bgLayout', min: 3, note: 'focus ring on page (1.4.11)' },
  { fg: 'focus', bg: 'bgContainer', min: 3, note: 'focus ring on surface (1.4.11)' },
];

export interface ContrastRow extends Pair {
  mode: Mode;
  value: number;
  pass: boolean;
}

/** Audit every key pair in both modes against the OKLCH source. */
export function auditContrast(tokensJsonPath: string): ContrastRow[] {
  const dt: any = JSON.parse(readFileSync(tokensJsonPath, 'utf8'));
  const role = (name: string) => dt.color.role[name];
  const triple = (tok: any, mode: Mode): Triple =>
    mode === 'dark' ? (tok.$extensions[TW].dark?.oklch ?? tok.$extensions[TW].oklch) : tok.$extensions[TW].oklch;
  const rows: ContrastRow[] = [];
  for (const mode of ['light', 'dark'] as Mode[]) {
    for (const p of PAIRS) {
      const value = ratio(triple(role(p.fg), mode), triple(role(p.bg), mode));
      rows.push({ ...p, mode, value, pass: value >= p.min });
    }
  }
  return rows;
}

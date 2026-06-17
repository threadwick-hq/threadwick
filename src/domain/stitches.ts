/**
 * Canonical crochet stitch table — shared by StitchSymbol, StitchLegend and any chart
 * renderer so the legend and the artwork never drift apart.
 *
 * Notation follows standard crochet charting:
 *   chain      -> oval
 *   slip st    -> filled dot
 *   sc         -> cross
 *   hdc        -> T (vertical bar + top cap)
 *   dc/tr/dtr  -> T with 1 / 2 / 3 diagonal slashes (slashes encode stitch height)
 *
 * The symbol is the same worldwide; only the *name* differs between US and UK
 * conventions (UK terms run "one taller" than US). Symbols — not colour — carry the
 * meaning, which is what makes crochet charts colour-blind-safe (keep them, per WCAG).
 */
export type StitchType = 'chain' | 'slip' | 'sc' | 'hdc' | 'dc' | 'tr' | 'dtr';

export type CrochetRegion = 'US' | 'UK';

export interface StitchDef {
  /** Canonical symbol id (region-independent). */
  type: StitchType;
  /** US crochet term + abbreviation. */
  us: string;
  usAbbr: string;
  /** UK crochet term + abbreviation. */
  uk: string;
  ukAbbr: string;
  /** Diagonal slashes across the stem (encodes stitch height). */
  slashes: number;
}

export const STITCHES: StitchDef[] = [
  { type: 'chain', us: 'Chain', usAbbr: 'ch', uk: 'Chain', ukAbbr: 'ch', slashes: 0 },
  { type: 'slip', us: 'Slip stitch', usAbbr: 'sl st', uk: 'Slip stitch', ukAbbr: 'sl st', slashes: 0 },
  { type: 'sc', us: 'Single crochet', usAbbr: 'sc', uk: 'Double crochet', ukAbbr: 'dc', slashes: 0 },
  { type: 'hdc', us: 'Half double crochet', usAbbr: 'hdc', uk: 'Half treble', ukAbbr: 'htr', slashes: 0 },
  { type: 'dc', us: 'Double crochet', usAbbr: 'dc', uk: 'Treble', ukAbbr: 'tr', slashes: 1 },
  { type: 'tr', us: 'Treble', usAbbr: 'tr', uk: 'Double treble', ukAbbr: 'dtr', slashes: 2 },
  { type: 'dtr', us: 'Double treble', usAbbr: 'dtr', uk: 'Triple treble', ukAbbr: 'trtr', slashes: 3 },
];

/** The stitch name for the chosen region. */
export function stitchName(s: StitchDef, region: CrochetRegion): string {
  return region === 'UK' ? s.uk : s.us;
}

/** The stitch abbreviation for the chosen region. */
export function stitchAbbr(s: StitchDef, region: CrochetRegion): string {
  return region === 'UK' ? s.ukAbbr : s.usAbbr;
}

/** Number of diagonal slashes across the stem for the "post" stitches. */
export const STITCH_SLASHES: Record<StitchType, number> = Object.fromEntries(
  STITCHES.map((s) => [s.type, s.slashes]),
) as Record<StitchType, number>;

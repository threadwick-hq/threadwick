/**
 * Canonical crochet stitch symbols, shared by StitchSymbol, StitchLegend and
 * GrannyChartMock so the legend and the hero artwork never drift apart.
 *
 * Notation follows standard crochet charting:
 *   chain      -> oval
 *   slip st    -> filled dot
 *   sc         -> cross
 *   hdc        -> T (vertical bar + top cap)
 *   dc/tr/dtr  -> T with 1 / 2 / 3 diagonal slashes (slashes encode stitch height)
 *
 * The symbol is the same worldwide; only the *name* differs between US and UK
 * conventions (UK terms run "one taller" than US).
 */
export type StitchType = 'chain' | 'slip' | 'sc' | 'hdc' | 'dc' | 'tr' | 'dtr';

export type CrochetRegion = 'US' | 'UK';

export interface StitchDef {
  type: StitchType;
  /** US crochet term */
  us: string;
  /** UK crochet term */
  uk: string;
}

export const STITCHES: StitchDef[] = [
  { type: 'chain', us: 'Chain', uk: 'Chain' },
  { type: 'slip', us: 'Slip stitch', uk: 'Slip stitch' },
  { type: 'sc', us: 'Single crochet', uk: 'Double crochet' },
  { type: 'hdc', us: 'Half double crochet', uk: 'Half treble' },
  { type: 'dc', us: 'Double crochet', uk: 'Treble' },
  { type: 'tr', us: 'Treble', uk: 'Double treble' },
  { type: 'dtr', us: 'Double treble', uk: 'Triple treble' },
];

/** Returns the stitch name for the chosen region. */
export function stitchName(s: StitchDef, region: CrochetRegion): string {
  return region === 'UK' ? s.uk : s.us;
}

/** Number of diagonal slashes across the stem for the "post" stitches. */
export const STITCH_SLASHES: Record<StitchType, number> = {
  chain: 0,
  slip: 0,
  sc: 0,
  hdc: 0,
  dc: 1,
  tr: 2,
  dtr: 3,
};

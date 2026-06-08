import type { CSSProperties } from 'react';
import { STITCH_SLASHES, type StitchType } from '../data/stitches';
import { colors } from '../theme/tokens';

/**
 * Draws a single crochet symbol as SVG primitives inside a cell centred on (0,0)
 * spanning roughly -10..10. Returned as a <g> so it can be reused both standalone
 * (StitchSymbol) and composed into larger artwork (GrannyChartMock).
 */
export function StitchGlyph({
  type,
  color = colors.text,
  strokeWidth = 2,
}: {
  type: StitchType;
  color?: string;
  strokeWidth?: number;
}) {
  const stroke = {
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    fill: 'none',
  };

  if (type === 'chain') {
    return <ellipse cx={0} cy={0} rx={8} ry={5} {...stroke} />;
  }
  if (type === 'slip') {
    return <circle cx={0} cy={0} r={3.4} fill={color} />;
  }
  if (type === 'sc') {
    return (
      <g {...stroke}>
        <line x1={0} y1={-7} x2={0} y2={7} />
        <line x1={-7} y1={0} x2={7} y2={0} />
      </g>
    );
  }

  // hdc / dc / tr / dtr : a vertical "T" with N diagonal slashes on the stem.
  const slashes = STITCH_SLASHES[type];
  const gap = 4.6;
  const start = -((slashes - 1) / 2) * gap;
  return (
    <g {...stroke}>
      <line x1={0} y1={-8} x2={0} y2={8} />
      <line x1={-5} y1={-8} x2={5} y2={-8} />
      {Array.from({ length: slashes }).map((_, i) => {
        const yc = start + i * gap;
        return <line key={i} x1={-4.5} y1={yc - 2.4} x2={4.5} y2={yc + 2.4} />;
      })}
    </g>
  );
}

/** A standalone, labelled symbol — used by the legend. */
export function StitchSymbol({
  type,
  size = 34,
  color,
  label,
  style,
}: {
  type: StitchType;
  size?: number;
  color?: string;
  label?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="-12 -12 24 24"
      role="img"
      aria-label={label}
      aria-hidden={label ? undefined : true}
      style={style}
    >
      <StitchGlyph type={type} color={color} />
    </svg>
  );
}

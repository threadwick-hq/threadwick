import { colors } from '../theme/tokens';
import { StitchGlyph } from './StitchSymbol';

/**
 * A stylised crochet granny-square chart, drawn entirely as SVG so it scales
 * crisply and uses the brand palette. It's illustrative, not a literal pattern.
 *
 * To swap in a real Studio screenshot later, replace this <svg> with an
 * <img src="..." alt="A crochet granny-square chart in Threadwick Studio" />
 * of the same aspect ratio.
 */

interface Round {
  count: number;
  radius: number;
  color: string;
}

const ROUNDS: Round[] = [
  { count: 8, radius: 32, color: colors.primary },
  { count: 12, radius: 58, color: colors.text },
  { count: 16, radius: 84, color: colors.textSecondary },
];

/** Three double-crochet posts fanned together — the classic granny cluster. */
function Cluster({ color }: { color: string }) {
  return (
    <>
      {[-7, 0, 7].map((dx) => (
        <g key={dx} transform={`translate(${dx} 0)`}>
          <StitchGlyph type="dc" color={color} strokeWidth={2.1} />
        </g>
      ))}
    </>
  );
}

export function GrannyChartMock({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="-112 -112 224 224"
      width="100%"
      role="img"
      aria-label="A crochet granny-square chart, with rounds of stitch clusters arranged around a centre ring."
    >
      {/* faint square frame */}
      <rect
        x={-100}
        y={-100}
        width={200}
        height={200}
        rx={16}
        fill="none"
        stroke={colors.border}
        strokeWidth={2}
      />

      {/* rounds of clusters, arranged with rotational symmetry */}
      {ROUNDS.map((round) =>
        Array.from({ length: round.count }).map((_, i) => {
          const angle = (360 / round.count) * i;
          return (
            <g key={`${round.radius}-${i}`} transform={`rotate(${angle}) translate(0 ${-round.radius})`}>
              <Cluster color={round.color} />
            </g>
          );
        }),
      )}

      {/* chain spaces tucked into the four corners */}
      {[45, 135, 225, 315].map((angle) => (
        <g key={angle} transform={`rotate(${angle}) translate(0 -92)`}>
          <StitchGlyph type="chain" color={colors.primaryActive} strokeWidth={2} />
        </g>
      ))}

      {/* centre ring */}
      <circle cx={0} cy={0} r={13} fill="none" stroke={colors.primary} strokeWidth={2.4} />
      <circle cx={0} cy={0} r={3.6} fill={colors.primary} />
    </svg>
  );
}

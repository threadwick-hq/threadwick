import { STITCHES, stitchName, type CrochetRegion } from '../data/stitches';
import { colors, radii } from '../theme/tokens';
import { StitchSymbol } from './StitchSymbol';

/** A small grid pairing each crochet symbol with its name (US or UK term). */
export function StitchLegend({ region }: { region: CrochetRegion }) {
  return (
    <ul
      style={{
        listStyle: 'none',
        margin: 0,
        padding: 0,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
        gap: 12,
      }}
    >
      {STITCHES.map((s) => (
        <li
          key={s.type}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            height: 64,
            padding: '10px 12px',
            background: colors.bgContainer,
            border: `1px solid ${colors.border}`,
            borderRadius: radii.lg,
          }}
        >
          <span
            aria-hidden
            style={{
              display: 'grid',
              placeItems: 'center',
              width: 40,
              height: 40,
              flex: '0 0 auto',
              background: colors.primaryWash,
              borderRadius: radii.base,
            }}
          >
            <StitchSymbol type={s.type} size={28} />
          </span>
          <span
            style={{
              minWidth: 0,
              fontWeight: 600,
              lineHeight: 1.2,
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 2,
              overflow: 'hidden',
            }}
          >
            {stitchName(s, region)}
          </span>
        </li>
      ))}
    </ul>
  );
}

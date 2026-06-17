import { STITCHES, stitchName, type CrochetRegion } from './stitches';
import { StitchSymbol } from './StitchSymbol';

/**
 * A small grid pairing each crochet symbol with its name (US or UK term). Lists
 * symbol + name per stitch (never colour), so it doubles as the chart's accessible
 * key. Surfaces are themed tokens, so the legend follows light/dark.
 */
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
            minHeight: 64,
            padding: '10px 12px',
            background: 'var(--tw-bg-container)',
            border: '1px solid var(--tw-border)',
            borderRadius: 'var(--tw-radius-lg)',
          }}
        >
          <span
            style={{
              display: 'grid',
              placeItems: 'center',
              width: 40,
              height: 40,
              flex: '0 0 auto',
              background: 'var(--tw-primary-wash)',
              borderRadius: 'var(--tw-radius)',
            }}
          >
            {/* The glyph carries the accessible name (it is the stitch), so AT hears the
                symbol→name pairing; the visible text below is a sighted duplicate. */}
            <StitchSymbol type={s.type} size={28} label={stitchName(s, region)} />
          </span>
          <span aria-hidden style={{ minWidth: 0, fontWeight: 600, lineHeight: 1.2 }}>
            {stitchName(s, region)}
          </span>
        </li>
      ))}
    </ul>
  );
}

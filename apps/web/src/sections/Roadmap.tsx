import type { CSSProperties } from 'react';
import { SectionHeading } from '../components/SectionHeading';
import { StitchSymbol } from '../components/StitchSymbol';
import { AUDIENCE_LABEL, PLANNED_FEATURES, type PlannedFeature } from '../data/planned';
import { colors, radii } from '../theme/tokens';
import './roadmap.css';

const CREAM = colors.bgLayout;

function chipStyle(feature: PlannedFeature): CSSProperties {
  const base: CSSProperties = {
    fontSize: 11.5,
    fontWeight: 600,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    padding: '3px 9px',
    borderRadius: 999,
    whiteSpace: 'nowrap',
  };
  if (feature.accent === 'ink') {
    return { ...base, background: 'rgba(246, 244, 239, 0.16)', color: CREAM };
  }
  switch (feature.audience) {
    case 'artists':
      // Soft lavender — distinct from the terracotta brand accents and the sage makers chip.
      return { ...base, background: '#eae4f2', color: '#62518a' };
    case 'you':
      // Warm sage — a caring, handmade complement to the terracotta artists chip.
      return { ...base, background: '#e6ede0', color: '#4e6a44' };
    default:
      return { ...base, background: colors.bgSunken, color: colors.textSecondary };
  }
}

/** Decorative "progress" strip for the hero tile: stitches done, stitches to go. */
function FollowAlongStrip() {
  const done = colors.primary;
  // Faded markers: keep a SOLID stroke colour and fade the whole SVG via opacity.
  // Per-stroke alpha would stack where strokes intersect (cross, slashed T) and
  // leave darker artifacts at the overlaps.
  const upcoming = { color: CREAM, style: { opacity: 0.35 } as const };
  return (
    <div aria-hidden style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 6, paddingTop: 18 }}>
      <StitchSymbol type="chain" size={26} color={done} />
      <StitchSymbol type="sc" size={26} color={done} />
      <StitchSymbol type="dc" size={26} color={done} />
      <StitchSymbol type="dc" size={26} {...upcoming} />
      <StitchSymbol type="tr" size={26} {...upcoming} />
      <span style={{ marginLeft: 8, fontSize: 12.5, color: 'rgba(246, 244, 239, 0.6)' }}>
        Round 3 of 5
      </span>
    </div>
  );
}

function Tile({ feature }: { feature: PlannedFeature }) {
  const { icon: Icon, accent, size, title, body, audience } = feature;
  const ink = accent === 'ink';

  const tileClass = [
    'tw-bento__tile',
    size === 'hero' && 'tw-bento__tile--hero',
    size === 'wide' && 'tw-bento__tile--wide',
    accent === 'ink' && 'tw-bento__tile--ink',
    accent === 'wash' && 'tw-bento__tile--wash',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <li className={tileClass}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <span
          aria-hidden
          style={{
            display: 'grid',
            placeItems: 'center',
            width: 40,
            height: 40,
            borderRadius: radii.lg,
            background: ink ? colors.primary : accent === 'wash' ? colors.bgContainer : colors.primaryWash,
            color: ink ? '#fff' : colors.primary,
          }}
        >
          <Icon width="1.4em" height="1.4em" />
        </span>
        <span style={chipStyle(feature)}>{AUDIENCE_LABEL[audience]}</span>
      </div>

      <h3
        className="tw-display"
        style={{
          margin: 0,
          fontSize: size === 'hero' ? 'clamp(22px, 2.6vw, 27px)' : 17.5,
          lineHeight: 1.25,
          color: ink ? CREAM : colors.text,
        }}
      >
        {title}
      </h3>
      <p
        style={{
          margin: 0,
          fontSize: 14.5,
          lineHeight: 1.55,
          color: ink ? 'rgba(246, 244, 239, 0.72)' : colors.textSecondary,
        }}
      >
        {body}
      </p>

      {size === 'hero' && <FollowAlongStrip />}
    </li>
  );
}

export function Roadmap() {
  return (
    <section aria-labelledby="roadmap-title" className="tw-section">
      <div className="tw-container">
        <SectionHeading
          id="roadmap-title"
          eyebrow="Planned · On the roadmap"
          title="What’s on the hook"
          lead="Threadwick is growing. Here’s what we’re making next — for the artists who design patterns, and the makers who follow them."
          align="center"
        />
        <ul className="tw-bento">
          {PLANNED_FEATURES.map((f) => (
            <Tile key={f.title} feature={f} />
          ))}
        </ul>
        <p style={{ margin: '18px 0 0', textAlign: 'center', fontSize: 13, color: colors.textSecondary }}>
          Roadmap — order and details may change as we make them.
        </p>
      </div>
    </section>
  );
}

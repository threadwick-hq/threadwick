import { glyphSVG } from '@threadwick/editor/chart';
import { STITCHES } from '@threadwick/editor/chart';
import type { StitchType } from '@threadwick/editor/chart';

export function Glyph({ type, size = 34, color }: { type: StitchType; size?: number; color?: string }) {
  return (
    <span
      className="glyph-wrap"
      role="img"
      aria-label={STITCHES[type]?.name ?? type}
      dangerouslySetInnerHTML={{ __html: glyphSVG(type, size, color) }}
    />
  );
}

import { glyphSVG } from '@threadwick/editor';
import { STITCHES } from '@threadwick/editor';
import type { StitchType } from '@threadwick/editor';

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

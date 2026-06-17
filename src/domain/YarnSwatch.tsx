import type { CSSProperties } from 'react';

export type YarnColor = 'brick' | 'teal' | 'ochre' | 'fern' | 'clay' | 'plum';

/**
 * A single yarn colour swatch from the craft palette. Themed via the `--tw-yarn-*`
 * tokens, so it follows light/dark. Always labelled (`role="img"` + `aria-label`) since
 * colour alone never conveys meaning.
 */
export function YarnSwatch({
  color,
  label,
  size = 24,
  style,
}: {
  color: YarnColor;
  label?: string;
  size?: number;
  style?: CSSProperties;
}) {
  return (
    <span
      role="img"
      aria-label={label ?? `${color} yarn`}
      style={{
        display: 'inline-block',
        inlineSize: size,
        blockSize: size,
        borderRadius: 'var(--tw-radius-sm)',
        background: `var(--tw-yarn-${color})`,
        border: '1px solid var(--tw-border)',
        ...style,
      }}
    />
  );
}

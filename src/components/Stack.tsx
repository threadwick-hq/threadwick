import { createElement, type CSSProperties, type ElementType, type ReactNode } from 'react';
import { space, type SpaceKey } from '../tokens';

export interface StackProps {
  /** Gap between children — ONLY 8-px-grid `space` keys compile (off-grid can't be typed). */
  gap?: SpaceKey;
  direction?: 'row' | 'column';
  align?: CSSProperties['alignItems'];
  justify?: CSSProperties['justifyContent'];
  wrap?: boolean;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

/**
 * Layout primitive that enforces the 8-px grid: `gap` accepts only `space` scale keys, so raw
 * pixel spacing cannot creep into app code (fail-closed, per the spacing guardrail in §4b/§14).
 */
export function Stack({
  gap = 8,
  direction = 'column',
  align,
  justify,
  wrap,
  as = 'div',
  className,
  style,
  children,
}: StackProps) {
  return createElement(
    as,
    {
      className,
      style: {
        display: 'flex',
        flexDirection: direction,
        alignItems: align,
        justifyContent: justify,
        flexWrap: wrap ? 'wrap' : undefined,
        gap: space[gap],
        ...style,
      } satisfies CSSProperties,
    },
    children,
  );
}

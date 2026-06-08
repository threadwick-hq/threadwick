import { Button } from 'antd';
import type { ButtonProps } from 'antd';
import { ArrowRight } from 'iconoir-react';
import { STUDIO_IS_EXTERNAL, STUDIO_URL } from '../config';

/**
 * The single primary call to action, reused across the page. Renders an anchor to
 * the Studio (same-tab for the in-prod /studio path, new-tab for the external
 * dev/preview fallback). The Studio handles any sign-in itself.
 */
export function OpenStudioButton({
  children = 'Open Studio',
  showArrow = true,
  ...rest
}: ButtonProps & { showArrow?: boolean }) {
  return (
    <Button
      type="primary"
      href={STUDIO_URL}
      target={STUDIO_IS_EXTERNAL ? '_blank' : undefined}
      rel={STUDIO_IS_EXTERNAL ? 'noopener noreferrer' : undefined}
      icon={showArrow ? <ArrowRight aria-hidden /> : undefined}
      iconPosition="end"
      {...rest}
    >
      {children}
    </Button>
  );
}

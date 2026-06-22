import type { ThemeConfig } from 'antd';
import { lightTheme } from '@threadwick/core/theme';

/**
 * Ant Design theme — core's `lightTheme` (Brick & Ecru tokens) extended with home's
 * app-specific component tweaks. Design tokens come from @threadwick/core; only the
 * app-level component overrides live here.
 */
export const theme: ThemeConfig = {
  ...lightTheme,
  token: {
    ...lightTheme.token,
    colorLinkHover: lightTheme.token?.colorPrimary,
  },
  components: {
    ...lightTheme.components,
    Card: { paddingLG: 24 },
    Collapse: { headerBg: 'transparent', contentPadding: '4px 16px 16px' },
    Steps: { iconSize: 36 },
    Typography: { titleMarginBottom: '0.4em', titleMarginTop: 0 },
  },
};

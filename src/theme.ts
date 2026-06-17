import type { ThemeConfig } from 'antd';
import { lightTheme } from '@threadwick/core/theme';
import { tokens } from '@threadwick/core/tokens';

/**
 * Ant Design theme — core's `lightTheme` ("Brick & Ecru" tokens) extended with the
 * studio's app-specific component tweaks. Design tokens come from @threadwick/core;
 * only the studio-level component overrides live here.
 */
export const theme: ThemeConfig = {
  ...lightTheme,
  components: {
    ...lightTheme.components,
    Button: { ...lightTheme.components?.Button, fontWeight: 500 },
    Card: { paddingLG: 0 },
    Segmented: { itemSelectedBg: tokens.light.bgContainer },
    Modal: { borderRadiusLG: 12 },
    Tooltip: { colorBgSpotlight: tokens.light.text },
  },
};

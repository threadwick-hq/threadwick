import type { ThemeConfig } from 'antd';
import { colors, fonts, radii, shadows, sizing } from './tokens';

/**
 * Ant Design v5 theme — built from the raw tokens so the homepage matches
 * Threadwick Studio exactly. `cssVar: true` emits CSS variables so plain CSS can
 * read AntD tokens too.
 */
export const theme: ThemeConfig = {
  cssVar: true,
  token: {
    colorPrimary: colors.primary,
    colorInfo: colors.primary,
    colorLink: colors.link,
    colorLinkHover: colors.primary,

    colorText: colors.text,
    colorTextSecondary: colors.textSecondary,
    colorTextTertiary: colors.textTertiary,

    colorBgLayout: colors.bgLayout,
    colorBgContainer: colors.bgContainer,

    colorBorder: colors.border,
    colorBorderSecondary: colors.borderSecondary,

    controlHeight: sizing.controlHeight,
    fontSize: sizing.fontSize,

    borderRadius: radii.base,
    borderRadiusSM: radii.sm,
    borderRadiusLG: radii.lg,

    fontFamily: fonts.body,

    boxShadow: shadows.soft,
    boxShadowSecondary: shadows.softer,
    boxShadowTertiary: shadows.softer,

    wireframe: false,
  },
  components: {
    Button: {
      fontWeight: 600,
      primaryShadow: 'none',
      defaultShadow: 'none',
    },
    Card: {
      paddingLG: 24,
    },
    Collapse: {
      headerBg: 'transparent',
      contentPadding: '4px 16px 16px',
    },
    Steps: {
      iconSize: 36,
    },
    Typography: {
      titleMarginBottom: '0.4em',
      titleMarginTop: 0,
    },
  },
};

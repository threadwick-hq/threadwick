import type { ThemeConfig } from 'antd';
import { theme as algo } from 'antd';
import { fonts, radii, shadows, size, sizing, tokens } from '../tokens';

/** Either mode's resolved token set (OKLCH strings). */
type Palette = (typeof tokens)['light' | 'dark'];

/**
 * Build an Ant Design v5 ThemeConfig from Threadwick tokens. Dark mode uses
 * `darkAlgorithm`; `colorTextLightSolid` is set to `onPrimary` so primary buttons
 * get the correct on-colour per mode (white in light, dark ink in dark).
 */
const build = (t: Palette, dark: boolean): ThemeConfig => ({
	cssVar: true,
	algorithm: dark ? algo.darkAlgorithm : algo.defaultAlgorithm,
	token: {
		colorPrimary: t.primary,
		colorInfo: t.semantic.info,
		colorLink: t.link,
		colorText: t.text,
		colorTextSecondary: t.textSecondary,
		colorTextTertiary: t.textTertiary,
		colorBgLayout: t.bgLayout,
		colorBgContainer: t.bgContainer,
		colorBgElevated: t.bgElevated,
		colorBorder: t.border,
		colorBorderSecondary: t.borderSecondary,
		colorTextLightSolid: t.onPrimary, // text/icon on a primary fill
		colorSuccess: t.semantic.success,
		colorWarning: t.semantic.warning,
		colorError: t.semantic.danger,
		borderRadius: radii.base,
		borderRadiusSM: radii.sm,
		borderRadiusLG: radii.lg,
		controlHeight: sizing.controlHeight,
		controlHeightSM: size.control.sm,
		controlHeightLG: size.control.lg,
		fontSize: sizing.fontSize,
		fontFamily: fonts.body,
		boxShadow: shadows.soft,
		boxShadowSecondary: shadows.softer,
		wireframe: false,
	},
	components: {
		// biome-ignore lint/style/useNamingConvention: Ant Design component token keys are PascalCase.
		Button: { fontWeight: 600, primaryShadow: 'none', defaultShadow: 'none' },
	},
});

export const lightTheme = build(tokens.light, false);
export const darkTheme = build(tokens.dark, true);

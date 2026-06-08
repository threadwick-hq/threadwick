/**
 * Raw design tokens — the single source of truth for color, type, radius and shadow.
 *
 * These mirror Threadwick Studio's Ant Design theme so the homepage and the app read
 * as one product. They are consumed directly by `theme.ts` (Ant Design ThemeConfig),
 * by inline SVG art (StitchSymbol / GrannyChartMock) and — duplicated as CSS custom
 * properties — by `styles/tokens.css`. Keep all three in sync.
 */

export const colors = {
  // Brand
  primary: '#c2603f', // warm terracotta
  primaryHover: '#b1542f',
  primaryActive: '#a64e30',
  link: '#a64e30',

  // Soft terracotta tints (backgrounds, washes)
  primarySoft: '#f3e3da',
  primaryWash: '#fbf3ee',

  // Ink + warm grays
  text: '#21201c',
  textSecondary: '#6b675f',
  textTertiary: '#8a8275',

  // Surfaces
  bgLayout: '#f6f4ef', // warm cream page background
  bgContainer: '#ffffff',
  bgSunken: '#efebe2',

  // Borders
  border: '#e7e2d8',
  borderSecondary: '#efe9dd',
} as const;

export const radii = {
  base: 8,
  sm: 6,
  lg: 10,
  xl: 16,
} as const;

export const sizing = {
  controlHeight: 36,
  fontSize: 14,
  containerMaxWidth: 1120,
} as const;

export const fonts = {
  body: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
  display: '"Space Grotesk", Inter, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
} as const;

export const shadows = {
  soft: '0 1px 2px rgba(40,30,20,.06), 0 6px 20px rgba(40,30,20,.06)',
  softer: '0 1px 2px rgba(40,30,20,.08)',
  lifted: '0 2px 4px rgba(40,30,20,.06), 0 12px 32px rgba(40,30,20,.10)',
} as const;

/**
 * Design tokens — re-exported from @threadwick/core (the single source of truth).
 *
 * `colors` is the light-mode "Brick & Ecru" role palette as sRGB hex — a drop-in for the
 * former local hex tokens (same role names). For theme-aware values, prefer the `--tw-*`
 * CSS variables shipped by '@threadwick/core/tokens.css'.
 */
import { roleHex } from '@threadwick/core/tokens';

export const colors = roleHex.light;
export { radii, sizing, fonts, shadows } from '@threadwick/core/tokens';

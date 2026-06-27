// Thin shared UI layer — grown incrementally as consuming screens need it (per "right-size it").
// Seed: Stack, the 8-px spacing guardrail (gap accepts only `space` keys).
// Every shared component must pass the a11y gate: keyboard-operable · visibly focusable · labelled ·
// AA-contrast · never colour-only · reduced-motion-safe · screen-reader-checked.
export * from './Stack';
export * from './follow';
export * from './ui/accordion';
export * from './ui/alert';
export * from './ui/alert-dialog';
export * from './ui/badge';
export * from './ui/breadcrumb';
export * from './ui/button';
export * from './ui/card';
export * from './ui/color-picker';
export * from './ui/dialog';
export * from './ui/dropdown-menu';
export * from './ui/input';
export * from './ui/label';
export * from './ui/number-input';
export * from './ui/segmented';
export * from './ui/select';
export * from './ui/switch';
export * from './ui/tooltip';

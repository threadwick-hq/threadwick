// Thin shared UI layer — grown incrementally as consuming screens need it (per "right-size it").
// Seed: Stack, the 8-px spacing guardrail (gap accepts only `space` keys).
// Every shared component must pass the a11y gate: keyboard-operable · visibly focusable · labelled ·
// AA-contrast · never colour-only · reduced-motion-safe · screen-reader-checked.
export * from './Stack';
export * from './ui/button';
export * from './ui/card';
export * from './ui/input';

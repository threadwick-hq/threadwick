// The cloud on/off switch, derived from build-time env vars only. Kept free of
// any Supabase import so the local-only build can read it without pulling the
// SDK into the initial bundle — `TopBar` uses it to lazy-load the auth UI.
export const cloudEnabled = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY,
);

// The SPA's base path (mirrors vite.config.ts `base`); client.ts normalizes
// the address bar back here after the auth callback lands.
export const APP_BASE_PATH = '/studio/';

// The one OAuth / magic-link landing path. It must stay in step with the
// Supabase allow-list entry and the vercel.json SPA rewrite (pinned by a test).
export const AUTH_CALLBACK_PATH = `${APP_BASE_PATH}auth/callback`;

// The cloud on/off switch, derived from build-time env vars only. Kept free of
// any Supabase import so the local-only build can read it without pulling the
// SDK into the initial bundle — `TopBar` uses it to lazy-load the auth UI.
export const cloudEnabled = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY,
);

// The one OAuth / magic-link landing path. It must stay in step with the
// Supabase allow-list entry and the vercel.json SPA rewrite (pinned by a test).
export const AUTH_CALLBACK_PATH = '/studio/auth/callback';

// The Supabase client — the single gateway to every cloud feature (sign-in now;
// sync + sharing later). Cloud is strictly opt-in: with no VITE_SUPABASE_* env
// vars the app is the original local-only studio (no client, no network, no auth
// UI). The anon key is a public, publishable key — Row-Level Security, not key
// secrecy, is the security boundary — so shipping it in the static bundle is safe.
// The service_role key must never appear here.
import { createClient } from '@supabase/supabase-js';
import { AUTH_CALLBACK_PATH, cloudEnabled } from './config';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Landing from the fixed OAuth / magic-link callback: put the address bar back
// on the app base BEFORE the client below consumes the token hash, keeping the
// search + hash intact for detectSessionInUrl. The window guard matters — this
// module is also imported by the node-side vitest suite.
if (
  cloudEnabled &&
  typeof window !== 'undefined' &&
  window.location.pathname === AUTH_CALLBACK_PATH
) {
  window.history.replaceState(
    {},
    '',
    '/studio/' + window.location.search + window.location.hash,
  );
}

export const supabase = cloudEnabled
  ? createClient(url!, anonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true, // complete OAuth / magic-link redirects on load
        experimental: { passkey: true }, // passkeys are beta in supabase-js (opt-in)
      },
    })
  : null;

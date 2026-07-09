// Pure unit tests for the cloud groundwork. No Supabase, no network, no DOM — so
// these run in the existing hermetic vitest harness alongside the core tests.
import { test } from 'vitest';
import assert from 'node:assert/strict';

import { uid } from '@threadwick/editor/chart';
import { AUTH_CALLBACK_PATH, cloudEnabled } from '../src/cloud/config';
import { supabase } from '../src/cloud/client';
import vercelConfig from '../vercel.json';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

// Cloud is strictly env-gated: the flag mirrors the presence of the Supabase env
// vars, and the client exists only when the flag is on. With no env (local/CI)
// that means cloud is OFF and the app is the unchanged local-only studio; with
// env set (e.g. the Vercel build) it's ON. The invariant holds either way.
test('cloud flag mirrors env, and the client matches the flag', () => {
  const hasEnv = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
  assert.equal(cloudEnabled, hasEnv);
  assert.equal(supabase === null, !hasEnv);
});

// The fixed OAuth / magic-link callback is a three-way contract: the redirectTo
// constant, the Supabase allow-list entry (dashboard), and the Vercel SPA
// rewrite that stops the callback URL from 404ing. Pin the two in-repo parts.
test('the fixed auth callback path has a matching SPA rewrite', () => {
  assert.equal(AUTH_CALLBACK_PATH, '/studio/auth/callback');
  const rewrite = vercelConfig.rewrites.find((r) => r.source === AUTH_CALLBACK_PATH);
  assert.ok(rewrite, 'vercel.json must rewrite the auth callback to the SPA');
  assert.equal(rewrite.destination, '/studio/index.html');
});

test('uid: prefixed, uuid-shaped', () => {
  assert.match(uid('prj'), new RegExp('^prj_' + UUID.source.slice(1)));
  assert.match(uid(), new RegExp('^id_' + UUID.source.slice(1)));
});

test('uid: collision-resistant across many calls', () => {
  const seen = new Set<string>();
  for (let i = 0; i < 10000; i++) seen.add(uid('x'));
  assert.equal(seen.size, 10000);
});

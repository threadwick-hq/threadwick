/**
 * Single source for the "Open Studio" destination.
 *
 * Defaults to "/studio" (served by the Vercel rewrite in vercel.json). Override
 * with VITE_STUDIO_URL when you need to point elsewhere — e.g. a local Studio dev
 * server. Note: "/studio" only resolves where the rewrite exists (production and
 * Vercel previews), not in a bare local `vite dev`/`preview` without it.
 */
export const STUDIO_URL: string = import.meta.env.VITE_STUDIO_URL ?? '/studio';

/** Public repository for the Studio (used for the footer link). */
export const STUDIO_REPO_URL = 'https://github.com/Eiluviann/threadwick';

/**
 * True when the resolved Studio URL leaves this origin. Used to decide whether the
 * CTA should open in a new tab (external) or navigate in place (the /studio path).
 */
export const STUDIO_IS_EXTERNAL = /^https?:\/\//i.test(STUDIO_URL);

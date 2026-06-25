import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
	index('routes/home.tsx'),
	// The chart editor — a strictly client-only subtree (see routes/studio.tsx). The splat
	// reserves /studio* for the Studio app; its nav shell + child screens land in TW-020+.
	route('studio/*', 'routes/studio.tsx'),
] satisfies RouteConfig;

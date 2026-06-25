import { type RouteConfig, index, layout, route } from '@react-router/dev/routes';

export default [
	// Public marketing site (streaming SSR) under its own header/footer chrome.
	layout('routes/marketing.tsx', [index('routes/home.tsx')]),
	// The Studio app — a full-takeover, client-only shell (StudioShell). Children render into
	// its outlet; the editor is client-only, the rest are placeholders until later Phase 6 tasks.
	route('studio', 'routes/studio.tsx', [
		index('routes/studio/home.tsx'),
		route('editor', 'routes/studio/editor.tsx'),
		route(':section', 'routes/studio/section.tsx'),
	]),
] satisfies RouteConfig;

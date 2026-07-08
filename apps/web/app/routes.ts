import {
	index,
	layout,
	type RouteConfig,
	route,
} from '@react-router/dev/routes';

export default [
	// Public marketing site (streaming SSR) under its own header/footer chrome.
	layout('routes/marketing.tsx', [index('routes/home.tsx')]),
	// The Studio app — a full-takeover, client-only shell (StudioShell). Children render into
	// its outlet; the editor is client-only, the rest are placeholders until later Phase 6 tasks.
	route('studio', 'routes/studio.tsx', [
		index('routes/studio/home.tsx'),
		route('editor', 'routes/studio/editor.tsx'),
		route('follow/:projectId/:refId', 'routes/studio/follow.tsx'),
		route('projects', 'routes/studio/projects-index.tsx'),
		route('projects/:projectId', 'routes/studio/project.tsx', [
			index('routes/studio/project/overview.tsx'),
			route('materials', 'routes/studio/project/materials.tsx'),
		]),
		route('patterns', 'routes/studio/patterns-index.tsx'),
		route('patterns/:patternId', 'routes/studio/pattern.tsx', [
			index('routes/studio/pattern/overview.tsx'),
		]),
		route('library/patterns', 'routes/studio/library/patterns.tsx'),
		route('library/yarns', 'routes/studio/library/yarns.tsx'),
		route('library/tools', 'routes/studio/library/tools.tsx'),
		// Every other destination (Marketplace, …) is a placeholder for now.
		route('*', 'routes/studio/section.tsx'),
	]),
] satisfies RouteConfig;

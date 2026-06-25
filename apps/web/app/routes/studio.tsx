import { EditorMount } from '../studio/editor-mount';

export function meta() {
	return [
		{ title: 'Threadwick Studio — chart editor' },
		{ name: 'description', content: 'Design crochet charts the way you crochet them — round by round.' },
	];
}

/**
 * /studio is the offline-capable chart editor: it runs entirely in the browser (a DOM
 * canvas controller + a localStorage-backed store), so it must never reach streaming SSR.
 *
 * A `clientLoader` (with `hydrate`) plus a `HydrateFallback` makes the server render only the
 * fallback and mount the editor after hydration; the browser runtime is dynamically imported
 * inside `EditorMount`, so no `window`/`localStorage` code is bundled into the server output.
 */
export async function clientLoader() {
	return null;
}
clientLoader.hydrate = true as const;

export function HydrateFallback() {
	return (
		<div className="flex min-h-[70vh] items-center justify-center">
			<p className="text-sm text-muted-foreground">Loading the studio…</p>
		</div>
	);
}

export default function StudioRoute() {
	return <EditorMount />;
}

import { useEffect, useRef } from 'react';
import { ensureStudioStore } from './studio-store';

/**
 * Client-only mount for the chart editor. The store is hydrated once by `ensureStudioStore`
 * (shared with the sidebar); here we attach the imperative DOM canvas controller — dynamically
 * imported so none of it reaches streaming SSR. The controller draws the `<svg>` and subscribes
 * to the store, so the chart redraws without re-rendering React. A re-mount re-attaches to the
 * live in-memory state rather than reloading over it.
 */
export function EditorMount() {
	const svgRef = useRef<SVGSVGElement>(null);

	useEffect(() => {
		const svg = svgRef.current;
		if (!svg) return;
		let active = true;
		let dispose = () => {};

		void (async () => {
			const [store, browser] = await Promise.all([ensureStudioStore(), import('@threadwick/editor/browser')]);
			if (!active) return;
			const { initCanvas } = browser;

			// Open the most recent project's active pattern so the canvas has a chart to draw
			// (only when nothing is open yet — a re-mount keeps the current pattern).
			const project = store.state.library.projects[0];
			if (project && store.state.ui.view !== 'editor') {
				const version = project.versions.find((v) => v.id === project.activeVersionId);
				const pattern = version?.patterns[0];
				if (pattern) store.openPattern(project.id, pattern.id);
			}

			// Autosave on data changes (the canvas only persists view changes itself).
			let saveTimer: ReturnType<typeof setTimeout> | undefined;
			const unsubscribeSave = store.subscribe(() => {
				clearTimeout(saveTimer);
				saveTimer = setTimeout(() => store.saveLocal(), 350);
			});

			const controller = initCanvas(store, svg, {});
			const unsubscribeDraw = store.subscribe(() => controller.invalidate());
			const raf = requestAnimationFrame(() => controller.fit());

			dispose = () => {
				cancelAnimationFrame(raf);
				clearTimeout(saveTimer);
				unsubscribeSave();
				unsubscribeDraw();
				controller.destroy();
			};
		})();

		return () => {
			active = false;
			dispose();
		};
	}, []);

	return (
		<div className="relative h-full min-h-[400px] w-full overflow-hidden bg-secondary">
			<svg
				ref={svgRef}
				className="block h-full w-full touch-none"
				role="img"
				aria-label="Pattern chart"
				xmlns="http://www.w3.org/2000/svg"
			/>
		</div>
	);
}

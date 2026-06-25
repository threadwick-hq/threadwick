import { useEffect, useRef } from 'react';

declare global {
	interface Window {
		/** Debug/smoke-test handle exposed by the editor mount (the localStorage-backed store). */
		threadwick?: { store: unknown };
	}
}

// The store is a module singleton that outlives client navigation (the dynamically imported
// module stays cached), so hydrate from localStorage exactly once per page load. Re-mounting on
// navigate-back must re-attach the canvas to the LIVE in-memory state, not reload over it —
// reloading would discard undo/redo history and any edit still inside the autosave debounce.
let hydrated = false;

/**
 * Client-only mount for the chart editor. The editor runtime — the imperative DOM canvas
 * controller and the `localStorage`-backed store — is dynamically imported inside the effect,
 * so none of it is bundled into or executed during streaming SSR. The controller draws the
 * `<svg>` itself and subscribes to the store, so the chart redraws without re-rendering React.
 */
export function EditorMount() {
	const svgRef = useRef<SVGSVGElement>(null);

	useEffect(() => {
		const svg = svgRef.current;
		if (!svg) return;
		let active = true;
		let dispose = () => {};

		void (async () => {
			const [core, browser] = await Promise.all([import('@threadwick/editor'), import('@threadwick/editor/browser')]);
			if (!active) return;
			const { store, initCanvas } = browser;

			// Hydrate once per page load; a re-mount keeps the live in-memory state untouched.
			if (!hydrated) {
				hydrated = true;
				// First run: seed a worked sample so the editor opens on something real.
				store.loadLocal();
				if (store.state.library.projects.length === 0) {
					store.state.library.projects.push(core.sampleProject());
					store.saveLocal();
				}
				// Open the most recent project's active pattern so the canvas has a chart to draw.
				const project = store.state.library.projects[0];
				if (project && store.state.ui.view !== 'editor') {
					const version = project.versions.find((v) => v.id === project.activeVersionId);
					const pattern = version?.patterns[0];
					if (pattern) store.openPattern(project.id, pattern.id);
				}
			}

			// Autosave on data changes (the canvas only persists view changes itself).
			let saveTimer: ReturnType<typeof setTimeout> | undefined;
			const unsubscribeSave = store.subscribe(() => {
				clearTimeout(saveTimer);
				saveTimer = setTimeout(() => store.saveLocal(), 350);
			});

			window.threadwick = { store };

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

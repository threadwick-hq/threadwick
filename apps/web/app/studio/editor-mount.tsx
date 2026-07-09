import { Button } from '@threadwick/core/ui';
import { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { ensureStudioStore, useStudioStore } from './studio-store';

function FollowEntry() {
	const store = useStudioStore();
	if (!store) return null;
	const project = store.state.library.projects[0];
	const ref = project?.makePatterns?.[0];
	if (!project || !ref) return null;
	return (
		<div className="absolute right-3 top-3 z-10">
			<Button variant="secondary" size="sm" asChild>
				<Link to={`/studio/follow/${project.id}/${ref.id}`}>Follow</Link>
			</Button>
		</div>
	);
}

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
			const [store, browser] = await Promise.all([
				ensureStudioStore(),
				import('@threadwick/editor/browser'),
			]);
			if (!active) return;
			const { initCanvas } = browser;

			// Open the most recent project's active pattern so the canvas has a chart to draw
			// (only when nothing is open yet — a re-mount keeps the current pattern).
			const project = store.state.library.projects[0];
			if (project && store.state.ui.view !== 'editor') {
				const version = project.versions.find(
					(v) => v.id === project.activeVersionId,
				);
				const pattern = version?.patterns[0];
				if (pattern) store.openPattern(project.id, pattern.id);
			}

			// Seed a make ref when the sample project has none yet.
			if (project?.makePatterns?.length === 0) {
				const version = project.versions.find(
					(v) => v.id === project.activeVersionId,
				);
				const pattern = version?.patterns[0];
				if (pattern) store.addMakePatternRef(pattern.id);
			}

			// Autosave is owned by the store (enabled once in studio-store); the
			// canvas only persists its own view changes.
			const controller = initCanvas(store, svg, {});
			const unsubscribeDraw = store.subscribe(() => controller.invalidate());
			const raf = requestAnimationFrame(() => controller.fit());

			dispose = () => {
				cancelAnimationFrame(raf);
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
			<FollowEntry />
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

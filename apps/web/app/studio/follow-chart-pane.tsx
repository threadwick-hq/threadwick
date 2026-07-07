import { cn } from '@threadwick/core/lib/utils';
import {
	type FollowMode,
	type Pattern,
	type PatternProgress,
	resolveFollowChartContext,
	stitchInspectInfo,
} from '@threadwick/editor';
import { Icon } from '@threadwick/icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type FollowChartPaneProps = {
	pattern: Pattern;
	progress?: PatternProgress;
	mode: FollowMode;
	className?: string;
	canvasClassName?: string;
};

type ViewBox = {
	x: number;
	y: number;
	width: number;
	height: number;
};

const ZOOM_FACTOR = 1.12;

function viewBoxFromBounds(
	bounds: { minX: number; minY: number; maxX: number; maxY: number },
	padding = 20,
): ViewBox {
	const w = Math.max(bounds.maxX - bounds.minX, 40);
	const h = Math.max(bounds.maxY - bounds.minY, 40);
	return {
		x: bounds.minX - padding,
		y: bounds.minY - padding,
		width: w + padding * 2,
		height: h + padding * 2,
	};
}

function parseViewBox(svg: SVGSVGElement): ViewBox {
	const vb = svg.viewBox.baseVal;
	if (vb.width > 0) {
		return { x: vb.x, y: vb.y, width: vb.width, height: vb.height };
	}
	const parts = (svg.getAttribute('viewBox') ?? '0 0 100 100')
		.split(/\s+/)
		.map(Number);
	return {
		x: parts[0] ?? 0,
		y: parts[1] ?? 0,
		width: parts[2] ?? 100,
		height: parts[3] ?? 100,
	};
}

function clientToSvg(
	svg: SVGSVGElement,
	clientX: number,
	clientY: number,
): { x: number; y: number } {
	const pt = svg.createSVGPoint();
	pt.x = clientX;
	pt.y = clientY;
	const ctm = svg.getScreenCTM();
	if (!ctm) return { x: 0, y: 0 };
	const local = pt.matrixTransform(ctm.inverse());
	return { x: local.x, y: local.y };
}

/** Interactive chart pane: round state styling, follow-position, zoom, tap-to-inspect. */
export function FollowChartPane({
	pattern,
	progress,
	mode,
	className,
	canvasClassName,
}: FollowChartPaneProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const chartRef = useRef<HTMLDivElement>(null);
	const [viewBox, setViewBox] = useState<ViewBox | null>(null);
	const [inspectedId, setInspectedId] = useState<string | null>(null);
	const [userAdjusted, setUserAdjusted] = useState(false);
	const panRef = useRef<{ x: number; y: number; active: boolean }>({
		x: 0,
		y: 0,
		active: false,
	});
	const panMovedRef = useRef(false);

	const chartCtx = useMemo(
		() => resolveFollowChartContext(pattern, progress, mode),
		[pattern, progress, mode],
	);

	const inspected = useMemo(
		() => (inspectedId ? stitchInspectInfo(pattern, inspectedId) : null),
		[pattern, inspectedId],
	);

	const progressKey = `${progress?.unitsDone ?? 0}:${progress?.cursor?.unitAddress ?? ''}`;

	// biome-ignore lint/correctness/useExhaustiveDependencies: progressKey/mode are intentional triggers — progress or mode changes release a manual zoom back to auto-fit
	useEffect(() => {
		setUserAdjusted(false);
	}, [progressKey, mode]);

	const applyFit = useCallback(() => {
		setViewBox(viewBoxFromBounds(chartCtx.focusBounds));
	}, [chartCtx.focusBounds]);

	useEffect(() => {
		if (!userAdjusted) applyFit();
	}, [applyFit, userAdjusted]);

	useEffect(() => {
		const el = containerRef.current;
		if (!el || typeof ResizeObserver === 'undefined') return;
		const ro = new ResizeObserver(() => {
			if (!userAdjusted) applyFit();
		});
		ro.observe(el);
		return () => ro.disconnect();
	}, [applyFit, userAdjusted]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: chartCtx.svg is an intentional trigger — the innerHTML swap replaces the <svg> node, so the viewBox must be re-applied to the new element
	useEffect(() => {
		const svg = chartRef.current?.querySelector('svg');
		if (!svg || !viewBox) return;
		svg.setAttribute(
			'viewBox',
			`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`,
		);
	}, [viewBox, chartCtx.svg]);

	const onWheel = useCallback((e: React.WheelEvent) => {
		e.preventDefault();
		setUserAdjusted(true);
		const svg = chartRef.current?.querySelector('svg');
		if (!svg) return;
		const vb = parseViewBox(svg);
		const factor = e.deltaY > 0 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR;
		const anchor = clientToSvg(svg, e.clientX, e.clientY);
		const nx = anchor.x - (anchor.x - vb.x) * factor;
		const ny = anchor.y - (anchor.y - vb.y) * factor;
		setViewBox({
			x: nx,
			y: ny,
			width: vb.width * factor,
			height: vb.height * factor,
		});
	}, []);

	const onPointerDown = useCallback((e: React.PointerEvent) => {
		if (e.button !== 0) return;
		panMovedRef.current = false;
		panRef.current = { x: e.clientX, y: e.clientY, active: true };
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
	}, []);

	const onPointerMove = useCallback((e: React.PointerEvent) => {
		if (!panRef.current.active) return;
		const svg = chartRef.current?.querySelector('svg');
		if (!svg) return;
		const vb = parseViewBox(svg);
		const rect = svg.getBoundingClientRect();
		const dx = ((e.clientX - panRef.current.x) / rect.width) * vb.width;
		const dy = ((e.clientY - panRef.current.y) / rect.height) * vb.height;
		if (Math.abs(dx) > 1 || Math.abs(dy) > 1) panMovedRef.current = true;
		panRef.current = { x: e.clientX, y: e.clientY, active: true };
		setUserAdjusted(true);
		setViewBox({
			x: vb.x - dx,
			y: vb.y - dy,
			width: vb.width,
			height: vb.height,
		});
	}, []);

	const onPointerUp = useCallback((e: React.PointerEvent) => {
		panRef.current.active = false;
		(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
	}, []);

	const onChartClick = useCallback((e: React.MouseEvent) => {
		if (panMovedRef.current) return;
		const target = (e.target as Element).closest('[data-id]');
		if (!target) {
			setInspectedId(null);
			return;
		}
		const id = target.getAttribute('data-id');
		if (id) setInspectedId(id);
	}, []);

	const resetView = useCallback(() => {
		setUserAdjusted(false);
		setInspectedId(null);
		applyFit();
	}, [applyFit]);

	return (
		<div className={cn('relative flex flex-col', className)}>
			<div
				ref={containerRef}
				className={cn(
					'relative h-[220px] w-full touch-none overflow-hidden rounded-lg border border-border bg-muted/40 md:h-[280px] [@media(min-width:768px)_and_(orientation:landscape)]:h-full [@media(min-width:768px)_and_(orientation:landscape)]:min-h-[260px] lg:h-full lg:min-h-[260px]',
					canvasClassName,
				)}
				onWheel={onWheel}
				onPointerDown={onPointerDown}
				onPointerMove={onPointerMove}
				onPointerUp={onPointerUp}
				onPointerCancel={onPointerUp}
				role="application"
				aria-label="Pattern chart — scroll to zoom, drag to pan, tap a stitch to inspect"
			>
				{/* biome-ignore lint/a11y/noStaticElementInteractions: click-delegation surface inside the role="application" wrapper above, which owns the interaction semantics */}
				{/* biome-ignore lint/a11y/useKeyWithClickEvents: stitch inspection is pointer-driven today; a keyboard path needs chart-navigation design (Follow-view a11y follow-up) */}
				<div
					ref={chartRef}
					className="h-full w-full [&_svg]:block [&_svg]:h-full [&_svg]:w-full [&_.stitch]:cursor-pointer"
					onClick={onChartClick}
					// biome-ignore lint/security/noDangerouslySetInnerHtml: editor SVG markup is trusted
					dangerouslySetInnerHTML={{ __html: chartCtx.svg }}
				/>
				{inspected && (
					<div
						className="pointer-events-none absolute bottom-2 left-2 right-2 rounded-md border border-border bg-background/95 px-3 py-2 shadow-sm backdrop-blur-sm"
						role="status"
					>
						<p className="text-xs text-muted-foreground">
							{inspected.roundName}
						</p>
						<p className="text-sm font-medium text-foreground">
							{inspected.name}
							{inspected.abbr ? (
								<span className="ml-1 font-normal text-muted-foreground">
									({inspected.abbr})
								</span>
							) : null}
						</p>
					</div>
				)}
			</div>
			<div className="mt-1.5 flex items-center justify-between px-0.5">
				<p className="text-[11px] uppercase tracking-wide text-muted-foreground">
					Chart
				</p>
				<button
					type="button"
					className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
					onClick={resetView}
				>
					<Icon name="refresh" label="" className="size-3.5" />
					Reset view
				</button>
			</div>
		</div>
	);
}

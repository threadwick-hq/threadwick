import { Link, useParams } from 'react-router';
import {
	CounterPillRow,
	ExternalSourcePane,
	FollowFooter,
	FollowHeader,
	FollowModeSelector,
	FollowShell,
	InstructionBox,
	useFollowSplitLayout,
	useWakeLock,
} from '@threadwick/core/components';
import { FollowChartPane } from './follow-chart-pane';
import {
	activeVersion,
	hasStructuredChartData,
	isExternalRef,
	resolveExternalFollowContext,
	resolveFollowContext,
	segmentsFromInstructionLine,
} from '@threadwick/editor';
import { Icon } from '@threadwick/icons';
import { useStudioStore } from './studio-store';

/**
 * Responsive Follow surface (TW-029–031): structured chart path for Threadwick
 * patterns; external fallback checklist + open source for Ravelry/PDF (TW-032).
 */
export function FollowMount() {
	const store = useStudioStore();
	const splitLayout = useFollowSplitLayout();
	const wakeLock = useWakeLock(true);
	const { projectId, refId } = useParams<{
		projectId: string;
		refId: string;
	}>();

	if (!store) {
		return (
			<div className="px-4 py-8 text-sm text-muted-foreground">
				Loading follow mode…
			</div>
		);
	}

	if (!projectId || !refId) {
		return (
			<div className="px-4 py-8 text-sm text-muted-foreground">
				Missing project or pattern reference.
			</div>
		);
	}

	const prj = store.state.library.projects.find((p) => p.id === projectId);
	if (!prj) {
		return (
			<div className="px-4 py-8">
				<p className="text-sm text-muted-foreground">Project not found.</p>
				<Link
					to="/studio/editor"
					className="mt-2 text-sm text-primary underline-offset-4 hover:underline"
				>
					Back to editor
				</Link>
			</div>
		);
	}

	const ref = prj.makePatterns?.find((r) => r.id === refId);
	if (!ref) {
		return (
			<div className="px-4 py-8">
				<p className="text-sm text-muted-foreground">
					Pattern reference not found.
				</p>
				<Link
					to="/studio/editor"
					className="mt-2 text-sm text-primary underline-offset-4 hover:underline"
				>
					Back to editor
				</Link>
			</div>
		);
	}

	const backLink = (
		<Link
			to={`/studio/projects/${projectId}`}
			className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground"
			aria-label="Back to project"
		>
			<Icon name="close" label="" className="size-4" />
		</Link>
	);

	if (isExternalRef(ref)) {
		const ctx = resolveExternalFollowContext(ref);
		const sections = ctx.sections.map((section) => ({
			...section,
			segments: section.instructionLine
				? segmentsFromInstructionLine(section.instructionLine)
				: [],
		}));
		const unitLabel =
			ref.progress?.completed === true
				? 'Done'
				: `Round ${(ref.progress?.unitsDone ?? 0) + 1}`;

		return (
			<FollowShell
				header={
					<FollowHeader
						title={ref.label}
						subtitle={`Checklist · ${unitLabel}`}
						backSlot={backLink}
						keepAwake={wakeLock.enabled}
						onKeepAwakeChange={(enabled) => {
							void wakeLock.setEnabled(enabled);
						}}
						keepAwakeSupported={wakeLock.supported}
					/>
				}
				chart={
					<ExternalSourcePane
						label={ref.label}
						sourceLabel={ctx.sourceLabel}
						sourceHref={ctx.sourceHref}
						designer={
							ref.designer ? `by ${ref.designer}` : undefined
						}
						className="[@media(min-width:768px)_and_(orientation:landscape)]:h-full lg:h-full"
					/>
				}
				pills={<CounterPillRow pills={ctx.pills} />}
				instructions={<InstructionBox sections={sections} />}
				footer={
					<div>
						<FollowFooter
							percent={ctx.percent}
							actionLabel={ctx.actionLabel}
							canUndo={ctx.canUndo}
							actionDisabled={ref.progress?.completed === true}
							layout={splitLayout ? 'inline' : 'stacked'}
							onAction={() => store.advanceFollow(ref.id)}
							onUndo={() => store.undoFollow(ref.id)}
							className={
								splitLayout
									? 'px-4 pb-2 pt-0 md:px-0 md:pb-0'
									: undefined
							}
						/>
						{(ref.progress?.unitsDone ?? 0) > 0 &&
						ref.progress?.completed !== true ? (
							<div
								className={
									splitLayout
										? 'px-4 pb-4 text-center md:px-0 md:pb-0'
										: 'px-4 pb-4 text-center'
								}
							>
								<button
									type="button"
									className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
									onClick={() => store.completeFollow(ref.id)}
								>
									Mark pattern finished
								</button>
							</div>
						) : null}
					</div>
				}
			/>
		);
	}

	if (!hasStructuredChartData(ref)) {
		return (
			<div className="px-4 py-8 text-sm text-muted-foreground">
				Unsupported pattern reference.
			</div>
		);
	}

	const chart = activeVersion(prj).patterns.find((p) => p.id === ref.patternId);
	if (!chart) {
		return (
			<div className="px-4 py-8">
				<p className="text-sm text-muted-foreground">Chart not found.</p>
				<Link
					to="/studio/editor"
					className="mt-2 text-sm text-primary underline-offset-4 hover:underline"
				>
					Back to editor
				</Link>
			</div>
		);
	}

	const ctx = resolveFollowContext(ref, chart);
	const modeSubtitle =
		ctx.mode === 'per-row'
			? 'Per-row'
			: ctx.mode === 'pattern'
				? 'Pattern'
				: ctx.mode === 'granular'
					? 'Granular'
					: 'Checklist';
	const unitLabel = ctx.display
		? `${ctx.display.unit.index} of ${ctx.display.unit.total}`
		: 'Done';

	const sections = ctx.sections.map((section) => ({
		...section,
		segments: section.instructionLine
			? segmentsFromInstructionLine(section.instructionLine)
			: [],
	}));

	return (
		<FollowShell
			header={
				<FollowHeader
					title={ref.label}
					subtitle={`${modeSubtitle} mode · ${unitLabel}`}
					backSlot={backLink}
					keepAwake={wakeLock.enabled}
					onKeepAwakeChange={(enabled) => {
						void wakeLock.setEnabled(enabled);
					}}
					keepAwakeSupported={wakeLock.supported}
				/>
			}
			modeSelector={
				<FollowModeSelector
					value={ctx.mode}
					onValueChange={(mode) => {
						store.setFollowMode(ref.id, mode);
					}}
				/>
			}
			chart={
				<FollowChartPane
					pattern={chart}
					progress={ref.progress}
					mode={ctx.mode}
					className="[@media(min-width:768px)_and_(orientation:landscape)]:h-full lg:h-full"
					canvasClassName="[@media(min-width:768px)_and_(orientation:landscape)]:border-0 [@media(min-width:768px)_and_(orientation:landscape)]:rounded-none lg:border-0 lg:rounded-none"
				/>
			}
			pills={<CounterPillRow pills={ctx.pills} />}
			instructions={<InstructionBox sections={sections} />}
			footer={
				<FollowFooter
					percent={ctx.percent}
					actionLabel={ctx.actionLabel}
					canUndo={ctx.canUndo}
					actionDisabled={ref.progress?.completed === true}
					layout={splitLayout ? 'inline' : 'stacked'}
					onAction={() => store.advanceFollow(ref.id)}
					onUndo={() => store.undoFollow(ref.id)}
					className={
						splitLayout
							? 'px-4 pb-4 pt-0 md:px-0 md:pb-0'
							: undefined
					}
				/>
			}
		/>
	);
}

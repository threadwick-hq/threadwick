import { Link, useParams } from 'react-router';
import {
	CounterPillRow,
	FollowFooter,
	FollowModeSelector,
	InstructionBox,
} from '@threadwick/core/components';
import { FollowChartPane } from './follow-chart-pane';
import {
	activeVersion,
	resolveFollowContext,
	segmentsFromInstructionLine,
} from '@threadwick/editor';
import { Icon } from '@threadwick/icons';
import { useStudioStore } from './studio-store';

/**
 * Phone-baseline Follow surface: chart pane, mode selector, counter pills,
 * instruction box, and the one-big-action footer (TW-029 / TW-030).
 */
export function FollowMount() {
	const store = useStudioStore();
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
	if (!ref || ref.source !== 'threadwick') {
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
		<div className="mx-auto w-full max-w-[380px] bg-background">
			<div className="flex items-center gap-2.5 px-4 pt-3.5 pb-2.5">
				<Link
					to="/studio/editor"
					className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground"
					aria-label="Back"
				>
					<Icon name="close" label="" className="size-4" />
				</Link>
				<div className="min-w-0 flex-1">
					<p className="truncate text-sm font-medium">{ref.label}</p>
					<p className="text-xs text-muted-foreground">
						{modeSubtitle} mode · {unitLabel}
					</p>
				</div>
			</div>

			<div className="px-4 pb-3">
				<FollowModeSelector
					value={ctx.mode}
					onValueChange={(mode) => {
						store.setFollowMode(ref.id, mode);
					}}
				/>
			</div>

			<div className="px-4 pb-3">
				<FollowChartPane
					pattern={chart}
					progress={ref.progress}
					mode={ctx.mode}
				/>
			</div>

			<CounterPillRow pills={ctx.pills} className="px-4 pb-3" />

			<div className="px-4">
				<InstructionBox sections={sections} />
			</div>

			<FollowFooter
				percent={ctx.percent}
				actionLabel={ctx.actionLabel}
				canUndo={ctx.canUndo}
				actionDisabled={ref.progress?.completed === true}
				onAction={() => store.advanceFollow(ref.id)}
				onUndo={() => store.undoFollow(ref.id)}
			/>
		</div>
	);
}

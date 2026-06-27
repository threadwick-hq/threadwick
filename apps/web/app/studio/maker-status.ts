import {
	MAKER_STATUS_COLOR,
	type MakerStatus,
	type StatusColor,
} from '@threadwick/types';

export const MAKER_STATUS_LABEL: Record<MakerStatus, string> = {
	draft: 'Draft',
	'in-progress': 'In progress',
	'on-hold': 'On hold',
	done: 'Done',
	frogged: 'Frogged',
};

export const MAKER_STATUS_OPTIONS: MakerStatus[] = [
	'draft',
	'in-progress',
	'on-hold',
	'done',
	'frogged',
];

/** Quiet status-dot colours (§5) mapped to Tailwind background utilities. */
export const STATUS_DOT_CLASS: Record<StatusColor, string> = {
	gray: 'bg-muted-foreground',
	blue: 'bg-sky-500',
	amber: 'bg-amber-500',
	green: 'bg-yarn-fern',
	red: 'bg-destructive',
};

export function makerStatusDotClass(status: MakerStatus): string {
	return STATUS_DOT_CLASS[MAKER_STATUS_COLOR[status]];
}

export function makerStatusLabel(status: MakerStatus | undefined): string {
	return MAKER_STATUS_LABEL[status ?? 'draft'];
}

export function patternSourceLabel(source: string): string {
	switch (source) {
		case 'threadwick':
			return 'Threadwick';
		case 'ravelry':
			return 'Ravelry';
		case 'blog':
			return 'Blog';
		case 'pdf':
			return 'PDF';
		default:
			return source;
	}
}

export function refProgressPercent(ref: {
	progress?: { unitsDone?: number; unitsTotal?: number; completed?: boolean };
}): number {
	if (ref.progress?.completed) return 100;
	const total = ref.progress?.unitsTotal;
	const done = ref.progress?.unitsDone ?? 0;
	if (!total || total <= 0) return done > 0 ? 100 : 0;
	return Math.min(100, Math.round((done / total) * 100));
}

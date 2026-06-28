import { Segmented, SegmentedItem } from '../ui/segmented';

export type FollowGranularity = 'per-row' | 'pattern' | 'granular';

const MODES: { value: FollowGranularity; label: string }[] = [
	{ value: 'per-row', label: 'Per-row' },
	{ value: 'pattern', label: 'Pattern' },
	{ value: 'granular', label: 'Granular' },
];

export type FollowModeSelectorProps = {
	value: FollowGranularity | 'checklist';
	onValueChange: (mode: FollowGranularity) => void;
	disabled?: boolean;
	className?: string;
};

/** Primary mode selector — Per-row · Pattern · Granular (§6). */
export function FollowModeSelector({
	value,
	onValueChange,
	disabled,
	className,
}: FollowModeSelectorProps) {
	const active = value === 'checklist' ? 'per-row' : value;
	return (
		<Segmented
			value={active}
			onValueChange={(next) => onValueChange(next as FollowGranularity)}
			disabled={disabled}
			block
			className={className}
			aria-label="Follow granularity"
		>
			{MODES.map((m) => (
				<SegmentedItem key={m.value} value={m.value} block>
					{m.label}
				</SegmentedItem>
			))}
		</Segmented>
	);
}

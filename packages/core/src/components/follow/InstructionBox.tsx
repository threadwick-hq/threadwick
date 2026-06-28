import { Icon } from '@threadwick/icons';
import { cn } from '../../lib/utils';

export type InstructionSegment = {
	kind: 'stitch' | 'connector' | 'text';
	text: string;
};

export function InstructionLine({
	segments,
	className,
}: {
	segments: InstructionSegment[];
	className?: string;
}) {
	if (!segments.length) return null;
	return (
		<p className={cn('text-[15px] leading-relaxed text-foreground', className)}>
			{segments.map((seg, i) => {
				if (seg.kind === 'stitch') {
					return (
						<b key={i} className="font-medium text-primary">
							{seg.text}
						</b>
					);
				}
				if (seg.kind === 'connector') {
					return (
						<i key={i} className="not-italic text-muted-foreground">
							{seg.text}
						</i>
					);
				}
				return <span key={i}>{seg.text}</span>;
			})}
		</p>
	);
}

export type InstructionSectionProps = {
	id?: string;
	title: string;
	subtitle?: string;
	step?: number;
	done: boolean;
	open: boolean;
	instructionLine?: string;
	segments?: InstructionSegment[];
	whyComment?: string | null;
	className?: string;
};

/** One Start / Round / Finish section in the instruction box. */
export function InstructionSection({
	title,
	subtitle,
	step = 1,
	done,
	open,
	instructionLine,
	segments = [],
	whyComment,
	className,
}: InstructionSectionProps) {
	return (
		<div
			className={cn(
				'rounded-lg border border-border overflow-hidden',
				open && 'border-primary/30',
				className,
			)}
		>
			<div
				className={cn(
					'flex items-center gap-2.5 px-3 py-2.5 text-sm',
					open && 'bg-primary/5 text-primary',
					done && !open && 'text-muted-foreground',
				)}
			>
				<span
					className={cn(
						'flex size-5 shrink-0 items-center justify-center rounded-full text-[11px]',
						done
							? 'bg-yarn-fern text-primary-foreground'
							: open
								? 'bg-primary text-primary-foreground'
								: 'bg-muted text-muted-foreground',
					)}
				>
					{done ? (
						<Icon name="confirm" label="" className="size-3" />
					) : (
						step
					)}
				</span>
				<span className="flex-1 min-w-0">
					<span className={cn(open && 'font-medium')}>{title}</span>
				</span>
				{subtitle && !open && (
					<span className="text-xs text-muted-foreground truncate">
						{subtitle}
					</span>
				)}
				{open && (
					<Icon
						name="expand"
						label=""
						className="size-4 shrink-0 text-muted-foreground"
					/>
				)}
			</div>
			{open && (
				<div className="px-3 pb-3.5 pt-0.5">
					<div className="rounded-md border border-border px-3.5 py-3">
						{segments.length > 0 ? (
							<InstructionLine segments={segments} />
						) : instructionLine ? (
							<p className="text-[15px] leading-relaxed text-foreground">
								{instructionLine}
							</p>
						) : null}
					</div>
					{whyComment && (
						<p className="mt-2 text-xs text-muted-foreground">{whyComment}</p>
					)}
				</div>
			)}
		</div>
	);
}

export type InstructionBoxProps = {
	sections: InstructionSectionProps[];
	className?: string;
};

/** Start · Round · Finish instruction box with accordion-on-check sections. */
export function InstructionBox({ sections, className }: InstructionBoxProps) {
	return (
		<div className={cn('flex flex-col gap-2', className)}>
			{sections.map((section, i) => (
				<InstructionSection
					key={section.id ?? section.title}
					{...section}
					step={i + 1}
				/>
			))}
		</div>
	);
}

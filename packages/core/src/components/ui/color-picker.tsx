import { Icon } from '@threadwick/icons';
import { useState } from 'react';
import {
	Button as AriaButton,
	type Color,
	ColorArea,
	ColorField,
	ColorSlider,
	ColorSwatch,
	ColorThumb,
	Dialog,
	DialogTrigger,
	Input,
	Popover,
	parseColor,
	SliderTrack,
} from 'react-aria-components';
import { cn } from '../../lib/utils';
import { Button } from './button';

/**
 * ColorPicker — a swatch trigger that opens an HSB area + hue + hex popover, built on
 * React Aria Components and themed Brick & Ecru (Radix has no colour primitive, so the
 * design system carves this one out — see MIGRATION Phase 4).
 *
 * Controlled by a hex string. Dragging previews live inside the popover and commits
 * `onChange` on release (parity with Ant Design's `onChangeComplete`); `onClear`, when
 * given, renders a "Use default" affordance and the trigger reads "Default" while cleared.
 */
export type ColorPickerProps = {
	value: string;
	onChange: (hex: string) => void;
	onClear?: () => void;
	isCleared?: boolean;
	disabled?: boolean;
	label?: string;
	className?: string;
};

export function ColorPicker({
	value,
	onChange,
	onClear,
	isCleared,
	disabled,
	label,
	className,
}: ColorPickerProps) {
	const [draft, setDraft] = useState<Color>(() => safeParse(value));
	const swatchColor = safeParse(value);
	const commit = (color: Color) =>
		onChange(color.toString('hex').toLowerCase());
	const triggerText = isCleared ? 'Default' : value.toLowerCase();

	const face = (
		<>
			<ColorSwatch
				color={swatchColor}
				className="size-4 shrink-0 rounded border border-border"
			/>
			<span className="font-mono text-xs uppercase">{triggerText}</span>
		</>
	);

	if (disabled) {
		return (
			<div
				className={cn(
					'flex h-9 w-full items-center gap-2 rounded-md border border-input bg-background px-3 opacity-50',
					className,
				)}
			>
				{face}
			</div>
		);
	}

	return (
		<DialogTrigger onOpenChange={(open) => open && setDraft(safeParse(value))}>
			<AriaButton
				aria-label={label}
				className={cn(
					'flex h-9 w-full items-center justify-start gap-2 rounded-md border border-input bg-background px-3 text-sm font-normal shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none data-[focus-visible]:ring-2 data-[focus-visible]:ring-ring',
					className,
				)}
			>
				{face}
			</AriaButton>
			<Popover
				placement="bottom start"
				className="z-50 rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-md"
			>
				<Dialog
					aria-label={label ?? 'Pick a colour'}
					className="flex w-56 flex-col gap-3 outline-none"
				>
					<ColorArea
						value={draft}
						onChange={setDraft}
						onChangeEnd={commit}
						colorSpace="hsb"
						xChannel="saturation"
						yChannel="brightness"
						className="relative h-36 w-full rounded-md border border-border"
					>
						<ColorThumb className="size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.45)] data-[focus-visible]:ring-2 data-[focus-visible]:ring-ring" />
					</ColorArea>
					<ColorSlider
						value={draft}
						onChange={setDraft}
						onChangeEnd={commit}
						colorSpace="hsb"
						channel="hue"
					>
						<SliderTrack className="relative h-3 w-full rounded-full border border-border">
							<ColorThumb className="top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.45)] data-[focus-visible]:ring-2 data-[focus-visible]:ring-ring" />
						</SliderTrack>
					</ColorSlider>
					<div className="flex items-center gap-2">
						<ColorField
							value={draft}
							onChange={(color) => {
								if (color) {
									setDraft(color);
									commit(color);
								}
							}}
							aria-label="Hex"
							className="flex-1"
						>
							<Input className="flex h-9 w-full rounded-md border border-input bg-background px-3 font-mono text-sm uppercase shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
						</ColorField>
						{onClear && (
							<Button type="button" variant="ghost" size="sm" onClick={onClear}>
								<Icon name="close" label="" /> Default
							</Button>
						)}
					</div>
				</Dialog>
			</Popover>
		</DialogTrigger>
	);
}

function safeParse(hex: string): Color {
	try {
		return parseColor(hex);
	} catch {
		return parseColor('#000000');
	}
}

import { STITCH_SLASHES, type StitchType } from '../data/stitches';

/** Draws one crochet symbol as SVG primitives centred on (0,0), spanning ~-10..10. */
export function StitchGlyph({
	type,
	color = 'currentColor',
	strokeWidth = 2,
}: {
	type: StitchType;
	color?: string;
	strokeWidth?: number;
}) {
	const stroke = {
		stroke: color,
		strokeWidth,
		strokeLinecap: 'round' as const,
		fill: 'none',
	};

	if (type === 'chain') {
		return <ellipse cx={0} cy={0} rx={8} ry={5} {...stroke} />;
	}
	if (type === 'slip') {
		return <circle cx={0} cy={0} r={3.4} fill={color} />;
	}
	if (type === 'sc') {
		return (
			<g {...stroke}>
				<line x1={0} y1={-7} x2={0} y2={7} />
				<line x1={-7} y1={0} x2={7} y2={0} />
			</g>
		);
	}

	// hdc / dc / tr / dtr: a vertical "T" with N diagonal slashes encoding stitch height.
	const slashes = STITCH_SLASHES[type];
	const gap = 4.6;
	const start = -((slashes - 1) / 2) * gap;
	return (
		<g {...stroke}>
			<line x1={0} y1={-8} x2={0} y2={8} />
			<line x1={-5} y1={-8} x2={5} y2={-8} />
			{Array.from({ length: slashes }).map((_, i) => {
				const yc = start + i * gap;
				return (
					<line
						key={`slash-${yc}`}
						x1={-4.5}
						y1={yc - 2.4}
						x2={4.5}
						y2={yc + 2.4}
					/>
				);
			})}
		</g>
	);
}

/** A standalone, optionally-labelled crochet symbol. */
export function StitchSymbol({
	type,
	size = 34,
	color,
	label,
	className,
}: {
	type: StitchType;
	size?: number;
	color?: string;
	label?: string;
	className?: string;
}) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="-12 -12 24 24"
			role="img"
			aria-label={label}
			aria-hidden={label ? undefined : true}
			className={className}
		>
			<StitchGlyph type={type} color={color} />
		</svg>
	);
}

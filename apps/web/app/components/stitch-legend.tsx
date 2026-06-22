import { STITCHES, type CrochetRegion, stitchName } from '../data/stitches';
import { StitchSymbol } from './stitch-symbol';

/** A small grid pairing each crochet symbol with its name (US or UK term). */
export function StitchLegend({ region }: { region: CrochetRegion }) {
	return (
		<ul className="grid list-none grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3 p-0">
			{STITCHES.map((stitch) => (
				<li
					key={stitch.type}
					className="flex h-16 items-center gap-3 rounded-lg border border-border bg-background px-3"
				>
					<span
						aria-hidden
						className="grid size-10 flex-none place-items-center rounded-md bg-accent text-accent-foreground"
					>
						<StitchSymbol type={stitch.type} size={28} />
					</span>
					<span className="line-clamp-2 min-w-0 font-medium leading-tight text-foreground">
						{stitchName(stitch, region)}
					</span>
				</li>
			))}
		</ul>
	);
}

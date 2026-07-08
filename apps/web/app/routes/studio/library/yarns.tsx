import { Button, CardGrid, EmptyState } from '@threadwick/core/components';
import { cn } from '@threadwick/core/lib/utils';
import { Icon } from '@threadwick/icons';
import {
	fixtureRavelrySource,
	type StashYarn,
	type YarnWeight,
} from '@threadwick/types';
import { useState } from 'react';
import { Link } from 'react-router';
import {
	addYarn,
	removeYarn,
	updateYarnQuantity,
	useStashYarns,
} from '../../../studio/library-store';

const WEIGHTS: YarnWeight[] = [
	'lace',
	'fingering',
	'sport',
	'dk',
	'worsted',
	'aran',
	'bulky',
	'super-bulky',
	'jumbo',
];

/** Library › Yarns — the stash swatch grid (spec §7): friendly-middle tracking, generative bridges. */
export default function LibraryYarns() {
	const yarns = useStashYarns();
	const [weightFilter, setWeightFilter] = useState<YarnWeight | null>(null);
	const shown = weightFilter
		? yarns.filter((y) => y.weight === weightFilter)
		: yarns;
	const stocked = new Set(yarns.map((y) => y.weight).filter(Boolean));

	return (
		<div className="px-6 py-8">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h1 className="text-2xl font-medium tracking-tight">Yarns</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						{yarns.length} in your stash — quantity tracking is optional.
					</p>
				</div>
				<Button size="sm" onClick={() => addNextFixtureYarn(yarns)}>
					<Icon name="add" label="" /> Add yarn
				</Button>
			</div>

			{yarns.length > 0 && (
				<div className="mt-4 flex flex-wrap gap-1.5">
					<FilterChip
						active={weightFilter === null}
						onClick={() => setWeightFilter(null)}
					>
						All
					</FilterChip>
					{WEIGHTS.filter((w) => stocked.has(w)).map((w) => (
						<FilterChip
							key={w}
							active={weightFilter === w}
							onClick={() => setWeightFilter(w)}
						>
							{w}
						</FilterChip>
					))}
				</div>
			)}

			{shown.length === 0 ? (
				<EmptyState
					className="mt-6"
					title={
						yarns.length === 0 ? 'Your stash is empty' : 'None at this weight'
					}
					description="Add a yarn to start tracking your stash."
				/>
			) : (
				<CardGrid className="mt-6">
					{shown.map((yarn) => (
						<YarnCard key={yarn.id} yarn={yarn} />
					))}
				</CardGrid>
			)}
		</div>
	);
}

function YarnCard({ yarn }: { yarn: StashYarn }) {
	const skeins = yarn.quantity?.skeins ?? 0;
	const setSkeins = (n: number) => {
		const { skeins: _drop, ...rest } = yarn.quantity ?? {};
		const next = n > 0 ? { ...rest, skeins: n } : rest;
		updateYarnQuantity(
			yarn.id,
			Object.keys(next).length > 0 ? next : undefined,
		);
	};

	return (
		<div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm">
			<div className="relative aspect-[4/3] w-full">
				{yarn.swatch ? (
					<img
						src={yarn.swatch.src}
						alt={yarn.swatch.alt ?? ''}
						loading="lazy"
						className="absolute inset-0 h-full w-full object-cover"
					/>
				) : (
					<div aria-hidden="true" className="absolute inset-0 bg-muted" />
				)}
			</div>
			<div className="flex flex-1 flex-col gap-1 p-3">
				<div className="truncate text-sm font-medium">{yarn.name}</div>
				<div className="truncate text-xs text-muted-foreground">
					{[yarn.brand, yarn.weight].filter(Boolean).join(' · ')}
				</div>
				<div className="mt-1 flex items-center gap-2 text-xs">
					<span className="text-muted-foreground">Skeins</span>
					<div className="flex items-center gap-1">
						<button
							type="button"
							aria-label={`Fewer skeins of ${yarn.name}`}
							className="flex size-6 items-center justify-center rounded-md border border-border hover:bg-muted/50"
							onClick={() => setSkeins(Math.max(0, skeins - 1))}
						>
							−
						</button>
						<span className="w-6 text-center tabular-nums">{skeins}</span>
						<button
							type="button"
							aria-label={`More skeins of ${yarn.name}`}
							className="flex size-6 items-center justify-center rounded-md border border-border hover:bg-muted/50"
							onClick={() => setSkeins(skeins + 1)}
						>
							+
						</button>
					</div>
				</div>
				<div className="mt-2 flex items-center justify-between">
					{yarn.weight ? (
						<Link
							to={`/studio/marketplace/browse?weight=${yarn.weight}`}
							className="text-xs font-medium text-primary hover:underline"
						>
							Find patterns for {yarn.weight}
						</Link>
					) : (
						<span />
					)}
					<button
						type="button"
						aria-label={`Remove ${yarn.name}`}
						className="text-xs text-muted-foreground hover:text-destructive"
						onClick={() => removeYarn(yarn.id)}
					>
						Remove
					</button>
				</div>
			</div>
		</div>
	);
}

function FilterChip({
	active,
	onClick,
	children,
}: {
	active: boolean;
	onClick: () => void;
	children: React.ReactNode;
}) {
	return (
		<button
			type="button"
			aria-pressed={active}
			onClick={onClick}
			className={cn(
				'rounded-full border px-3 py-1 text-xs font-medium capitalize transition-colors',
				active
					? 'border-primary bg-primary text-primary-foreground'
					: 'border-border bg-card text-muted-foreground hover:text-foreground',
			)}
		>
			{children}
		</button>
	);
}

// "+ Add yarn": seed the next Ravelry fixture yarn not already in the stash.
function addNextFixtureYarn(existing: StashYarn[]): void {
	const have = new Set(existing.map((y) => y.ravelryYarnId));
	const next = fixtureRavelrySource
		.searchYarns('')
		.find((meta) => !have.has(meta.ravelryYarnId));
	const meta = next ?? fixtureRavelrySource.searchYarns('')[0];
	if (!meta) return;
	addYarn({
		id: `stash-${meta.ravelryYarnId}-${existing.length}`,
		name: meta.name,
		brand: meta.brand,
		weight: meta.weight,
		ravelryYarnId: meta.ravelryYarnId,
	});
}

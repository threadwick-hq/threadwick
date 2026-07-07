import { cn } from '@threadwick/core/lib/utils';
import { Icon, type IconName } from '@threadwick/icons';
import { SectionHeading } from './section-heading';
import { StitchSymbol } from './stitch-symbol';

type Audience = 'studio' | 'artists' | 'you';
type TileSize = 'hero' | 'wide' | 'small';
type TileAccent = 'ink' | 'wash';
type PlannedFeature = {
	icon: IconName;
	audience: Audience;
	size: TileSize;
	accent?: TileAccent;
	title: string;
	body: string;
};

const AUDIENCE_LABEL: Record<Audience, string> = {
	studio: 'Studio',
	artists: 'For artists',
	you: 'For makers',
};

// Soft lavender (artists) and warm sage (makers) — distinct from the terracotta brand.
const CHIP: Record<Audience, string> = {
	studio: 'bg-muted text-muted-foreground',
	artists: 'bg-[#eae4f2] text-[#62518a]',
	you: 'bg-[#e6ede0] text-[#4e6a44]',
};

const PLANNED: PlannedFeature[] = [
	{
		icon: 'make-it',
		audience: 'you',
		size: 'hero',
		accent: 'ink',
		title: 'Follow along, stitch by stitch',
		body: 'An interactive viewer that walks you through a pattern step by step — on any device, even your phone — and keeps track of your progress as you go.',
	},
	{
		icon: 'edit',
		audience: 'artists',
		size: 'wide',
		title: 'Made for tablet and pencil',
		body: 'Full touch and Apple Pencil support, so you can chart with your hands — the way you actually sit with your yarn.',
	},
	{
		icon: 'refresh',
		audience: 'studio',
		size: 'small',
		title: 'Plays nicely with Ravelry',
		body: 'Projects, patterns and progress sync automatically with your Ravelry account.',
	},
	{
		icon: 'devices',
		audience: 'studio',
		size: 'small',
		title: 'Phone, tablet, PC',
		body: 'The whole studio, fully responsive on every screen.',
	},
	{
		icon: 'marketplace',
		audience: 'artists',
		size: 'wide',
		accent: 'wash',
		title: 'A marketplace that’s fair to fiber artists',
		body: 'A completely optional way to sell: publish your patterns for others to browse and buy, we handle the payments — and you keep most of the revenue.',
	},
	{
		icon: 'license-key',
		audience: 'artists',
		size: 'wide',
		title: 'Sell directly to your buyers',
		body: 'Issue license keys for your patterns. Buyers pay you directly — the money goes straight to you — and redeem their key in the app for permanent access. This stays, even after the marketplace arrives.',
	},
	{
		icon: 'fingerprint',
		audience: 'artists',
		size: 'wide',
		title: 'Every copy carries an invisible signature',
		body: 'Exports are fingerprinted invisibly. If a pattern turns up somewhere it shouldn’t, inspect the file and see exactly which copy it came from — protection for you, with no DRM hassle for honest makers.',
	},
	{
		icon: 'api',
		audience: 'artists',
		size: 'wide',
		title: 'An API for your workflow',
		body: 'Plug Threadwick into your own systems or Ravelry, and generate personalized, fingerprinted PDFs for every buyer — automatically.',
	},
	{
		icon: 'preview',
		audience: 'artists',
		size: 'wide',
		title: 'See exactly where each stitch lands',
		body: 'Charts that show precisely what you’re stitching into — the thing advanced patterns always leave out.',
	},
	{
		icon: 'pdf',
		audience: 'artists',
		size: 'small',
		title: 'A PDF that’s ready out of the box',
		body: 'Exports with all your pattern data, beautifully laid out and customizable.',
	},
	{
		icon: 'link',
		audience: 'artists',
		size: 'small',
		title: 'Publish with a link',
		body: 'One link, and anyone can open your pattern.',
	},
	{
		icon: 'view',
		audience: 'artists',
		size: 'small',
		title: 'Your patterns, at their best',
		body: 'A best-in-class pattern viewer that sets your work apart.',
	},
	{
		icon: 'organize',
		audience: 'you',
		size: 'small',
		title: 'Projects that track themselves',
		body: 'Multi-pattern projects with notes and automatic tracking, synced to Ravelry.',
	},
	{
		icon: 'customize',
		audience: 'you',
		size: 'wide',
		title: 'Charts you can shape',
		body: 'Adjust line weight, use your own yarn colors, customize your view. Your charts are no longer static images — you choose how you see them.',
	},
];

function FollowAlongStrip() {
	return (
		<div aria-hidden className="mt-auto flex items-center gap-1.5 pt-4">
			{(['chain', 'sc', 'dc'] as const).map((type) => (
				<StitchSymbol key={type} type={type} size={26} className="text-brand" />
			))}
			<StitchSymbol
				type="dc"
				size={26}
				className="text-background opacity-35"
			/>
			<StitchSymbol
				type="tr"
				size={26}
				className="text-background opacity-35"
			/>
			<span className="ml-2 text-xs text-background/60">Round 3 of 5</span>
		</div>
	);
}

function Tile({ feature }: { feature: PlannedFeature }) {
	const ink = feature.accent === 'ink';
	const wash = feature.accent === 'wash';
	return (
		<li
			className={cn(
				'flex flex-col gap-3 rounded-2xl border p-5',
				feature.size === 'hero' && 'lg:col-span-2 lg:row-span-2',
				feature.size === 'wide' && 'lg:col-span-2',
				ink && 'border-transparent bg-foreground text-background',
				wash && 'border-border bg-accent',
				!ink && !wash && 'border-border bg-card',
			)}
		>
			<div className="flex items-center justify-between gap-2.5">
				<span
					aria-hidden
					className={cn(
						'grid size-10 flex-none place-items-center rounded-lg [&_svg]:size-5',
						ink
							? 'bg-brand text-primary-foreground'
							: wash
								? 'bg-card text-primary'
								: 'bg-accent text-accent-foreground',
					)}
				>
					<Icon name={feature.icon} label="" />
				</span>
				<span
					className={cn(
						'whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
						ink ? 'bg-white/15 text-background' : CHIP[feature.audience],
					)}
				>
					{AUDIENCE_LABEL[feature.audience]}
				</span>
			</div>
			<h3
				className={cn(
					'font-display font-medium leading-tight',
					feature.size === 'hero'
						? 'text-[clamp(1.375rem,2.6vw,1.6875rem)]'
						: 'text-lg',
					ink ? 'text-background' : 'text-foreground',
				)}
			>
				{feature.title}
			</h3>
			<p
				className={cn(
					'text-sm leading-relaxed',
					ink ? 'text-background/75' : 'text-muted-foreground',
				)}
			>
				{feature.body}
			</p>
			{feature.size === 'hero' && <FollowAlongStrip />}
		</li>
	);
}

export function Roadmap() {
	return (
		<section
			id="roadmap"
			aria-labelledby="roadmap-title"
			className="mx-auto max-w-6xl px-6 py-16 sm:py-20"
		>
			<SectionHeading
				id="roadmap-title"
				eyebrow="Planned · On the roadmap"
				title="What’s on the hook"
				lead="Threadwick is growing. Here’s what we’re making next — for the artists who design patterns, and the makers who follow them."
				align="center"
			/>
			<ul className="grid list-none grid-flow-dense gap-4 p-0 sm:grid-cols-2 lg:grid-cols-4">
				{PLANNED.map((feature) => (
					<Tile key={feature.title} feature={feature} />
				))}
			</ul>
			<p className="mt-5 text-center text-sm text-muted-foreground">
				Roadmap — order and details may change as we make them.
			</p>
		</section>
	);
}

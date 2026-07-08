import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

/**
 * Action/intent-named icons — name what the user is DOING, never the glyph. The active
 * icon set maps each action to a concrete glyph, so a glyph can be swapped, or two
 * actions can diverge, without touching a single call site.
 */
export type IconName =
	// generic chrome
	| 'close'
	| 'search'
	| 'open-menu'
	| 'settings'
	| 'open-external'
	| 'expand'
	| 'collapse'
	| 'copy'
	| 'download'
	| 'confirm'
	| 'add'
	| 'delete'
	| 'edit'
	| 'next'
	| 'previous'
	| 'private'
	// pattern lifecycle — the "invisible handoff" verbs
	| 'publish-pattern'
	| 'open-in-studio'
	| 'make-it'
	| 'export-chart'
	| 'remix-pattern'
	// editor — stitch & chart actions
	| 'rotate-stitch-right'
	| 'rotate-stitch-left'
	| 'mirror-stitch'
	| 'add-round'
	| 'delete-stitch'
	| 'set-stitch-color'
	| 'set-origin'
	| 'undo'
	| 'redo'
	| 'zoom-in'
	| 'zoom-out'
	| 'fit'
	// editor — tool modes & chrome
	| 'select-mode'
	| 'insert-mode'
	| 'pan-mode'
	| 'import'
	| 'more'
	| 'chevron-down'
	| 'help'
	// project resources
	| 'yarn'
	| 'notes'
	| 'variation'
	// account & auth
	| 'sign-in'
	| 'sign-out'
	| 'account'
	| 'google'
	| 'mail'
	// content & feature illustration (marketing)
	| 'organize'
	| 'draft'
	| 'share-qr'
	| 'sync'
	| 'symbols'
	| 'community'
	| 'gift'
	| 'earnings'
	| 'no-lock-in'
	// roadmap / capabilities
	| 'refresh'
	| 'devices'
	| 'marketplace'
	| 'license-key'
	| 'fingerprint'
	| 'api'
	| 'preview'
	| 'pdf'
	| 'link'
	| 'view'
	| 'customize'
	// studio sidebar navigation
	| 'home'
	| 'patterns'
	| 'projects'
	| 'tools'
	| 'browse'
	| 'wishlist'
	// studio topbar
	| 'bell';

/** Per-action metadata, independent of any icon set. `label` is the default accessible name. */
export type IconMeta = {
	label: string;
};

/** An icon set maps every action to a concrete glyph. One adapter per library. */
export type IconSet = {
	readonly id: string;
	resolve(name: IconName): IconDefinition;
};

/** Default accessible labels, derived from the action; override per call site when needed. */
export const iconMeta: Record<IconName, IconMeta> = {
	close: { label: 'Close' },
	search: { label: 'Search' },
	'open-menu': { label: 'Open menu' },
	settings: { label: 'Settings' },
	'open-external': { label: 'Open in new tab' },
	expand: { label: 'Expand' },
	collapse: { label: 'Collapse' },
	copy: { label: 'Copy' },
	download: { label: 'Download' },
	confirm: { label: 'Confirm' },
	add: { label: 'Add' },
	delete: { label: 'Delete' },
	edit: { label: 'Edit' },
	next: { label: 'Next' },
	previous: { label: 'Previous' },
	private: { label: 'Private' },
	'publish-pattern': { label: 'Publish pattern' },
	'open-in-studio': { label: 'Open in Studio' },
	'make-it': { label: 'Make it' },
	'export-chart': { label: 'Export chart' },
	'remix-pattern': { label: 'Remix pattern' },
	'rotate-stitch-right': { label: 'Rotate stitch right' },
	'rotate-stitch-left': { label: 'Rotate stitch left' },
	'mirror-stitch': { label: 'Mirror stitch' },
	'add-round': { label: 'Add round' },
	'delete-stitch': { label: 'Delete stitch' },
	'set-stitch-color': { label: 'Set stitch color' },
	'set-origin': { label: 'Set origin' },
	undo: { label: 'Undo' },
	redo: { label: 'Redo' },
	'zoom-in': { label: 'Zoom in' },
	'zoom-out': { label: 'Zoom out' },
	fit: { label: 'Fit to screen' },
	'select-mode': { label: 'Select' },
	'insert-mode': { label: 'Insert' },
	'pan-mode': { label: 'Pan' },
	import: { label: 'Import' },
	more: { label: 'More' },
	'chevron-down': { label: 'Expand' },
	help: { label: 'How it works' },
	yarn: { label: 'Yarn' },
	notes: { label: 'Notes' },
	variation: { label: 'Variation' },
	'sign-in': { label: 'Sign in' },
	'sign-out': { label: 'Sign out' },
	account: { label: 'Account' },
	google: { label: 'Continue with Google' },
	mail: { label: 'Email' },
	organize: { label: 'Organize' },
	draft: { label: 'Drafts and versions' },
	'share-qr': { label: 'Share via QR' },
	sync: { label: 'Sync' },
	symbols: { label: 'Stitch symbols' },
	community: { label: 'Community' },
	gift: { label: 'Free' },
	earnings: { label: 'Earnings' },
	'no-lock-in': { label: 'No lock-in' },
	refresh: { label: 'Sync' },
	devices: { label: 'All devices' },
	marketplace: { label: 'Marketplace' },
	'license-key': { label: 'License key' },
	fingerprint: { label: 'Fingerprint' },
	api: { label: 'API' },
	preview: { label: 'Preview' },
	pdf: { label: 'PDF export' },
	link: { label: 'Share link' },
	view: { label: 'Viewer' },
	customize: { label: 'Customize' },
	home: { label: 'Home' },
	patterns: { label: 'Patterns' },
	projects: { label: 'Projects' },
	tools: { label: 'Tools' },
	browse: { label: 'Browse' },
	wishlist: { label: 'Wishlist' },
	bell: { label: 'Notifications' },
};

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
	| 'undo'
	| 'redo'
	| 'zoom-in'
	| 'zoom-out';

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
	undo: { label: 'Undo' },
	redo: { label: 'Redo' },
	'zoom-in': { label: 'Zoom in' },
	'zoom-out': { label: 'Zoom out' },
};

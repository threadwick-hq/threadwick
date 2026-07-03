/**
 * The work:v1 issue body engine.
 *
 * The issue body is the entire current spec, structured as fixed sections
 * under a marker comment. The CLI edits sections in place; GitHub's edit
 * history preserves prior revisions. Comments never carry spec.
 */

import type { Result } from './types';

export const BODY_MARKER = '<!-- work:v1';

export const SECTION_NAMES = [
	'Context',
	'Scope',
	'Acceptance',
	'Plan',
	'Alternatives considered',
] as const;

export type SectionName = (typeof SECTION_NAMES)[number];

export type ParsedBody = {
	marker: string;
	sections: { name: SectionName; content: string }[];
};

export type NewBodyInit = {
	context: string;
	scope: string;
	acceptance: readonly string[];
};

const MARKER_LINE =
	'<!-- work:v1 — managed by `pnpm run work`; sections are updated in place, do not reorder -->';
const PLAN_PLACEHOLDER =
	'_Filled at claim time, before implementation: chosen approach, sub-tasks in order, risks._';
const ALTERNATIVES_PLACEHOLDER =
	'_Filled with the plan: rejected options, one line each._';
const HEADING_PATTERN = /^## (.+?)\s*$/;

export function hasWorkMarker(body: string): boolean {
	return body.includes(BODY_MARKER);
}

/** Renders a fresh work:v1 body from the template. */
export function newBody(init: NewBodyInit): string {
	const acceptance =
		init.acceptance.length > 0
			? init.acceptance.map((item) => `- [ ] ${item}`).join('\n')
			: '- [ ] _to be defined_';
	const parsed: ParsedBody = {
		marker: MARKER_LINE,
		sections: [
			{ name: 'Context', content: init.context.trim() || '_to be filled_' },
			{ name: 'Scope', content: init.scope.trim() || 'In: ...\nOut: ...' },
			{ name: 'Acceptance', content: acceptance },
			{ name: 'Plan', content: PLAN_PLACEHOLDER },
			{ name: 'Alternatives considered', content: ALTERNATIVES_PLACEHOLDER },
		],
	};
	return renderBody(parsed);
}

/** Parses a work:v1 body into its marker and named sections. */
export function parseBody(body: string): Result<ParsedBody> {
	if (!hasWorkMarker(body)) {
		return { ok: false, error: `body has no ${BODY_MARKER} marker` };
	}
	const lines = body.split('\n');
	const markerLine = lines.find((line) => line.includes(BODY_MARKER));
	if (markerLine === undefined) {
		return { ok: false, error: `body has no ${BODY_MARKER} marker line` };
	}
	const sections: { name: SectionName; content: string }[] = [];
	let currentName: SectionName | undefined;
	let currentLines: string[] = [];
	for (const line of lines) {
		const heading = HEADING_PATTERN.exec(line);
		const name =
			heading?.[1] === undefined ? undefined : matchSectionName(heading[1]);
		if (name === undefined) {
			if (currentName !== undefined) currentLines.push(line);
			continue;
		}
		if (currentName !== undefined) {
			sections.push({
				name: currentName,
				content: currentLines.join('\n').trim(),
			});
		}
		currentName = name;
		currentLines = [];
	}
	if (currentName !== undefined) {
		sections.push({
			name: currentName,
			content: currentLines.join('\n').trim(),
		});
	}
	if (sections.length === 0) {
		return { ok: false, error: 'body has a marker but no known ## sections' };
	}
	return { ok: true, value: { marker: markerLine.trim(), sections } };
}

/** Renders a parsed body back to markdown, one blank line between blocks. */
export function renderBody(parsed: ParsedBody): string {
	const blocks = parsed.sections.map(
		(section) => `## ${section.name}\n\n${section.content}`,
	);
	return `${[parsed.marker, ...blocks].join('\n\n')}\n`;
}

/** Replaces one section's content, preserving everything else verbatim. */
export function setSection(
	body: string,
	sectionName: string,
	content: string,
): Result<string> {
	const name = matchSectionName(sectionName);
	if (name === undefined) {
		return {
			ok: false,
			error: `unknown section "${sectionName}" (expected one of: ${SECTION_NAMES.join(', ')})`,
		};
	}
	const parsed = parseBody(body);
	if (!parsed.ok) return parsed;
	const sections = parsed.value.sections.map((section) =>
		section.name === name ? { name, content: content.trim() } : section,
	);
	if (!sections.some((section) => section.name === name)) {
		sections.push({ name, content: content.trim() });
	}
	return {
		ok: true,
		value: renderBody({ marker: parsed.value.marker, sections }),
	};
}

/** Returns one section's content, or undefined when absent or unparsable. */
export function sectionContent(
	body: string,
	sectionName: string,
): string | undefined {
	const name = matchSectionName(sectionName);
	if (name === undefined) return undefined;
	const parsed = parseBody(body);
	if (!parsed.ok) return undefined;
	return parsed.value.sections.find((section) => section.name === name)
		?.content;
}

/** A plan counts as filled once it is non-empty and no longer the placeholder. */
export function isPlanFilled(body: string): boolean {
	const plan = sectionContent(body, 'Plan');
	return plan !== undefined && plan.length > 0 && !plan.startsWith('_Filled');
}

/** Case-insensitive match of a heading to a canonical section name. */
function matchSectionName(raw: string): SectionName | undefined {
	const normalized = raw.trim().toLowerCase();
	return SECTION_NAMES.find((name) => name.toLowerCase() === normalized);
}

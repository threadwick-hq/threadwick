import { describe, expect, it } from 'vitest';
import {
	hasWorkMarker,
	isPlanFilled,
	newBody,
	parseBody,
	sectionContent,
	setSection,
} from './body';

describe('newBody', () => {
	it('renders the work:v1 template with all sections', () => {
		const body = newBody({
			context: 'Why this exists.',
			scope: 'In: things\nOut: other things',
			acceptance: ['first criterion', 'second criterion'],
		});
		expect(hasWorkMarker(body)).toBe(true);
		expect(sectionContent(body, 'Context')).toBe('Why this exists.');
		expect(sectionContent(body, 'Scope')).toBe('In: things\nOut: other things');
		expect(sectionContent(body, 'Acceptance')).toBe(
			'- [ ] first criterion\n- [ ] second criterion',
		);
		expect(isPlanFilled(body)).toBe(false);
	});
});

describe('parseBody', () => {
	it('fails without the marker', () => {
		const result = parseBody('## Context\n\nno marker here');
		expect(result.ok).toBe(false);
	});

	it('parses sections case-insensitively and keeps unknown headings inside content', () => {
		const body = [
			'<!-- work:v1 test -->',
			'',
			'## context',
			'',
			'some context',
			'',
			'### a nested heading',
			'',
			'more context',
			'',
			'## Plan',
			'',
			'the plan',
		].join('\n');
		expect(sectionContent(body, 'Context')).toBe(
			'some context\n\n### a nested heading\n\nmore context',
		);
		expect(sectionContent(body, 'Plan')).toBe('the plan');
	});
});

describe('setSection', () => {
	const body = newBody({ context: 'ctx', scope: 'scope', acceptance: ['a'] });

	it('replaces one section and preserves the rest', () => {
		const updated = setSection(body, 'Plan', 'Chosen approach: do the thing.');
		expect(updated.ok).toBe(true);
		if (!updated.ok) return;
		expect(sectionContent(updated.value, 'Plan')).toBe(
			'Chosen approach: do the thing.',
		);
		expect(sectionContent(updated.value, 'Context')).toBe('ctx');
		expect(isPlanFilled(updated.value)).toBe(true);
	});

	it('round-trips: setting the same section twice keeps a stable body', () => {
		const once = setSection(body, 'Scope', 'In: x\nOut: y');
		expect(once.ok).toBe(true);
		if (!once.ok) return;
		const twice = setSection(once.value, 'Scope', 'In: x\nOut: y');
		expect(twice.ok).toBe(true);
		if (!twice.ok) return;
		expect(twice.value).toBe(once.value);
	});

	it('rejects unknown sections', () => {
		const result = setSection(body, 'Timeline', 'nope');
		expect(result.ok).toBe(false);
	});

	it('rejects bodies without the marker', () => {
		const result = setSection('plain body', 'Plan', 'content');
		expect(result.ok).toBe(false);
	});
});

describe('isPlanFilled', () => {
	it('treats the placeholder as unfilled', () => {
		const body = newBody({ context: '', scope: '', acceptance: [] });
		expect(isPlanFilled(body)).toBe(false);
	});

	it('treats real content as filled', () => {
		const body = newBody({ context: '', scope: '', acceptance: [] });
		const updated = setSection(body, 'Plan', 'Sub-tasks: 1. build 2. test');
		expect(updated.ok && isPlanFilled(updated.value)).toBe(true);
	});
});

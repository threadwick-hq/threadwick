import { describe, expect, it } from 'vitest';

import {
	findBlockReason,
	isPathExempt,
	planFilled,
} from '../.opencode/plugins/workflow-gates.js';

type TestIssue = {
	number: number;
	state: string;
	assignees: string[];
	body: string;
};

const CONTAINER = '/container';
const IMPLEMENTATION_FILE = `${CONTAINER}/main/packages/core/src/index.ts`;

function workBody(planSection: string): string {
	return [
		'## Context',
		'Some context.',
		'## Scope',
		'Some scope.',
		'## Plan',
		planSection,
		'## Alternatives considered',
		'A rejected option.',
	].join('\n');
}

function makeCache(issues: TestIssue[], viewerLogin = 'eilu') {
	return { snapshot: { issues, viewerLogin } };
}

function makeIssue(overrides: Partial<TestIssue> = {}): TestIssue {
	return {
		number: 12,
		state: 'OPEN',
		assignees: ['eilu'],
		body: workBody('Do the thing in two steps.'),
		...overrides,
	};
}

describe('planFilled', () => {
	it('is false for an undefined or empty body', () => {
		expect(planFilled(undefined)).toBe(false);
		expect(planFilled('')).toBe(false);
	});

	it('is false when the body has no Plan section', () => {
		expect(planFilled('## Context\nText.')).toBe(false);
	});

	it('is false when the Plan section is blank', () => {
		expect(planFilled(workBody('   \n'))).toBe(false);
	});

	it('is false for the work:v1 template placeholder', () => {
		expect(planFilled(workBody('_Filled during planning._'))).toBe(false);
	});

	it('is true when the Plan section has content', () => {
		expect(planFilled(workBody('1. Step one\n2. Step two'))).toBe(true);
	});

	it('does not count content from sections after the Plan', () => {
		const body = ['## Plan', '', '## Alternatives considered', 'Text.'].join('\n');
		expect(planFilled(body)).toBe(false);
	});
});

describe('isPathExempt', () => {
	it('exempts paths outside the container', () => {
		expect(isPathExempt('/elsewhere/notes.md', CONTAINER)).toBe(true);
	});

	it('gates implementation paths inside the container', () => {
		expect(isPathExempt(IMPLEMENTATION_FILE, CONTAINER)).toBe(false);
		expect(isPathExempt(CONTAINER, CONTAINER)).toBe(false);
	});

	it('exempts the work archive and agent config directories', () => {
		expect(isPathExempt(`${CONTAINER}/main/work/TW-001.md`, CONTAINER)).toBe(true);
		expect(isPathExempt(`${CONTAINER}/main/.claude/settings.json`, CONTAINER)).toBe(true);
		expect(isPathExempt(`${CONTAINER}/main/.opencode/plugins/x.js`, CONTAINER)).toBe(true);
	});
});

describe('findBlockReason', () => {
	it('allows exempt paths regardless of cache state', () => {
		expect(findBlockReason({}, '/elsewhere/notes.md', CONTAINER)).toBeUndefined();
	});

	it('blocks when the cache has no snapshot', () => {
		expect(findBlockReason({}, IMPLEMENTATION_FILE, CONTAINER)).toContain(
			'No assigned issue',
		);
	});

	it('blocks when no open issue is assigned to the viewer', () => {
		const cache = makeCache([
			makeIssue({ assignees: ['someone-else'] }),
			makeIssue({ number: 13, state: 'CLOSED' }),
		]);
		expect(findBlockReason(cache, IMPLEMENTATION_FILE, CONTAINER)).toContain(
			'No assigned issue',
		);
	});

	it('blocks and names the issue when every assigned issue is unplanned', () => {
		const cache = makeCache([makeIssue({ body: workBody('_Filled during planning._') })]);
		const reason = findBlockReason(cache, IMPLEMENTATION_FILE, CONTAINER);
		expect(reason).toContain('#12');
		expect(reason).toContain('unfilled Plan');
	});

	it('allows when the assigned issue has a filled plan', () => {
		const cache = makeCache([makeIssue()]);
		expect(findBlockReason(cache, IMPLEMENTATION_FILE, CONTAINER)).toBeUndefined();
	});

	it('allows when at least one of several assigned issues is planned', () => {
		const cache = makeCache([
			makeIssue({ number: 20, body: workBody('_Filled during planning._') }),
			makeIssue({ number: 21 }),
		]);
		expect(findBlockReason(cache, IMPLEMENTATION_FILE, CONTAINER)).toBeUndefined();
	});
});

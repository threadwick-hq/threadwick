import { describe, expect, it } from 'vitest';

import {
	findBlockReason,
	isPathExempt,
	planBlockReason,
	planFilled,
	WorkflowGates,
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
		const body = ['## Plan', '', '## Alternatives considered', 'Text.'].join(
			'\n',
		);
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
		expect(isPathExempt(`${CONTAINER}/main/work/TW-001.md`, CONTAINER)).toBe(
			true,
		);
		expect(
			isPathExempt(`${CONTAINER}/main/.claude/settings.json`, CONTAINER),
		).toBe(true);
		expect(
			isPathExempt(`${CONTAINER}/main/.opencode/plugins/x.js`, CONTAINER),
		).toBe(true);
	});
});

describe('findBlockReason', () => {
	it('allows exempt paths regardless of cache state', () => {
		expect(
			findBlockReason({}, '/elsewhere/notes.md', CONTAINER),
		).toBeUndefined();
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
		const cache = makeCache([
			makeIssue({ body: workBody('_Filled during planning._') }),
		]);
		const reason = findBlockReason(cache, IMPLEMENTATION_FILE, CONTAINER);
		expect(reason).toContain('#12');
		expect(reason).toContain('unfilled Plan');
	});

	it('allows when the assigned issue has a filled plan', () => {
		const cache = makeCache([makeIssue()]);
		expect(
			findBlockReason(cache, IMPLEMENTATION_FILE, CONTAINER),
		).toBeUndefined();
	});

	it('allows when at least one of several assigned issues is planned', () => {
		const cache = makeCache([
			makeIssue({ number: 20, body: workBody('_Filled during planning._') }),
			makeIssue({ number: 21 }),
		]);
		expect(
			findBlockReason(cache, IMPLEMENTATION_FILE, CONTAINER),
		).toBeUndefined();
	});
});

describe('planBlockReason (path-independent gate for pathless edit tools)', () => {
	it('blocks when no open issue is assigned, regardless of path', () => {
		expect(planBlockReason(makeCache([]))).toContain('No assigned issue');
	});

	it('blocks when every assigned issue is unplanned', () => {
		const cache = makeCache([
			makeIssue({ body: workBody('_Filled during planning._') }),
		]);
		expect(planBlockReason(cache)).toContain('unfilled Plan');
	});

	it('allows when an assigned issue is planned (patch on any path proceeds)', () => {
		expect(planBlockReason(makeCache([makeIssue()]))).toBeUndefined();
	});
});

describe('WorkflowGates hook registration', () => {
	// A non-repo working dir makes resolveGitContext fail closed to undefined,
	// so these assertions never touch the real work cache or spawn the gate.
	const nowhere = '/tmp/threadwick-workflow-gates-nonexistent';

	it('registers the event hook and no bare session.idle key', async () => {
		const hooks = await WorkflowGates({
			directory: nowhere,
			worktree: nowhere,
		});
		expect(typeof hooks.event).toBe('function');
		expect(typeof hooks['tool.execute.before']).toBe('function');
		expect(hooks['session.idle']).toBeUndefined();
	});

	it('the event hook ignores non-idle events without throwing', async () => {
		const hooks = await WorkflowGates({
			directory: nowhere,
			worktree: nowhere,
		});
		const eventHook = hooks.event;
		if (typeof eventHook !== 'function') throw new Error('event hook missing');
		await expect(
			eventHook({ event: { type: 'file.edited' } }),
		).resolves.toBeUndefined();
	});

	it('the event hook handles session.idle without throwing when the gate is absent', async () => {
		const hooks = await WorkflowGates({
			directory: nowhere,
			worktree: nowhere,
		});
		const eventHook = hooks.event;
		if (typeof eventHook !== 'function') throw new Error('event hook missing');
		await expect(
			eventHook({
				event: { type: 'session.idle', properties: { sessionID: 's' } },
			}),
		).resolves.toBeUndefined();
	});

	it('tool.execute.before is a no-op outside a git context', async () => {
		const hooks = await WorkflowGates({
			directory: nowhere,
			worktree: nowhere,
		});
		const beforeHook = hooks['tool.execute.before'];
		if (typeof beforeHook !== 'function')
			throw new Error('before hook missing');
		await expect(
			beforeHook({ tool: 'edit' }, { args: { filePath: '/x/y.ts' } }),
		).resolves.toBeUndefined();
	});
});

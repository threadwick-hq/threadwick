import { describe, expect, it } from 'vitest';
import type { GhResult, GhRunner } from './gh';
import {
	addAssignee,
	addBlockedBy,
	addComment,
	addLabels,
	createIssue,
	ensureAreaLabels,
	ensureIssueTypes,
	ensureMilestones,
	ensurePriorityField,
	ensureProject,
	issueDatabaseId,
	milestoneNumberForPhase,
	probeDependencies,
	removeBlockedBy,
	removeLabel,
	resolvePriorityField,
	resolveProject,
	setIssuePriority,
	setIssueType,
	updateIssueBody,
} from './mutations';

/** A GhRunner mock that records every call and answers with a canned result. */
function stubRunner(result: GhResult): {
	run: GhRunner;
	calls: { args: readonly string[]; stdin: string | undefined }[];
} {
	const calls: { args: readonly string[]; stdin: string | undefined }[] = [];
	const run: GhRunner = (args, stdin) => {
		calls.push({ args, stdin });
		return result;
	};
	return { run, calls };
}

/** A GhRunner mock that answers a fixed queue of results, one per call. */
function queueRunner(results: GhResult[]): {
	run: GhRunner;
	calls: { args: readonly string[]; stdin: string | undefined }[];
} {
	const calls: { args: readonly string[]; stdin: string | undefined }[] = [];
	let index = 0;
	const run: GhRunner = (args, stdin) => {
		calls.push({ args, stdin });
		const result = results[index];
		index += 1;
		if (result === undefined) {
			throw new Error(`queueRunner: no result queued for call #${index}`);
		}
		return result;
	};
	return { run, calls };
}

function ok(value: string): GhResult {
	return { ok: true, value };
}

function fail(message: string, exitCode = 1): GhResult {
	return { ok: false, error: { message, exitCode } };
}

/** Parses the JSON piped via `--input -`; throws if stdin was not valid JSON. */
function parseStdin(stdin: string | undefined): unknown {
	if (stdin === undefined) throw new Error('expected stdin to be piped');
	return JSON.parse(stdin);
}

describe('createIssue', () => {
	it('sends the exact argv and JSON payload, and reads number/url back', () => {
		const { run, calls } = stubRunner(
			// biome-ignore lint/style/useNamingConvention: GitHub API wire format
			ok(JSON.stringify({ number: 42, html_url: 'https://x/42' })),
		);
		const result = createIssue(run, {
			title: 'Add widget',
			body: 'body text',
			labels: ['area:repo'],
			milestoneNumber: 3,
		});
		expect(result).toEqual({
			ok: true,
			value: { number: 42, url: 'https://x/42' },
		});
		expect(calls).toHaveLength(1);
		expect(calls[0]?.args).toEqual([
			'api',
			'-X',
			'POST',
			'repos/threadwick-hq/threadwick/issues',
			'--input',
			'-',
		]);
		expect(parseStdin(calls[0]?.stdin)).toEqual({
			title: 'Add widget',
			body: 'body text',
			labels: ['area:repo'],
			milestone: 3,
		});
	});

	it('omits the milestone key entirely when milestoneNumber is undefined', () => {
		const { run, calls } = stubRunner(
			// biome-ignore lint/style/useNamingConvention: GitHub API wire format
			ok(JSON.stringify({ number: 1, html_url: 'https://x/1' })),
		);
		createIssue(run, {
			title: 'No milestone',
			body: 'b',
			labels: [],
			milestoneNumber: undefined,
		});
		const payload = parseStdin(calls[0]?.stdin);
		expect(payload).toEqual({ title: 'No milestone', body: 'b', labels: [] });
		expect(payload).not.toHaveProperty('milestone');
	});

	it('reports an unreadable response when number/url are missing', () => {
		const { run } = stubRunner(ok(JSON.stringify({ number: 5 })));
		const result = createIssue(run, {
			title: 't',
			body: 'b',
			labels: [],
			milestoneNumber: undefined,
		});
		expect(result).toEqual({
			ok: false,
			error: 'issue created but response was unreadable',
		});
	});

	it('surfaces a gh failure hint on error', () => {
		const { run } = stubRunner(
			fail('error connecting to api.github.com: dial tcp'),
		);
		const result = createIssue(run, {
			title: 't',
			body: 'b',
			labels: [],
			milestoneNumber: undefined,
		});
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error).toContain('network unreachable');
	});
});

describe('updateIssueBody', () => {
	it('PATCHes the issue with the body payload', () => {
		const { run, calls } = stubRunner(ok('{}'));
		const result = updateIssueBody(run, 7, 'new body');
		expect(result).toEqual({ ok: true, value: undefined });
		expect(calls[0]?.args).toEqual([
			'api',
			'-X',
			'PATCH',
			'repos/threadwick-hq/threadwick/issues/7',
			'--input',
			'-',
		]);
		expect(parseStdin(calls[0]?.stdin)).toEqual({ body: 'new body' });
	});
});

describe('setIssueType', () => {
	it('PATCHes the issue with the native issue-type name for the work type', () => {
		const { run, calls } = stubRunner(ok('{}'));
		const result = setIssueType(run, 7, 'fix');
		expect(result).toEqual({ ok: true, value: undefined });
		expect(calls[0]?.args).toEqual([
			'api',
			'-X',
			'PATCH',
			'repos/threadwick-hq/threadwick/issues/7',
			'--input',
			'-',
		]);
		expect(parseStdin(calls[0]?.stdin)).toEqual({ type: 'Bug' });
	});
});

describe('addAssignee', () => {
	it('POSTs a single-element assignees array', () => {
		const { run, calls } = stubRunner(ok('{}'));
		const result = addAssignee(run, 7, 'eiluviann');
		expect(result).toEqual({ ok: true, value: undefined });
		expect(calls[0]?.args).toEqual([
			'api',
			'-X',
			'POST',
			'repos/threadwick-hq/threadwick/issues/7/assignees',
			'--input',
			'-',
		]);
		expect(parseStdin(calls[0]?.stdin)).toEqual({ assignees: ['eiluviann'] });
	});
});

describe('addComment', () => {
	it('POSTs the body and returns the created comment url', () => {
		const { run, calls } = stubRunner(
			// biome-ignore lint/style/useNamingConvention: GitHub API wire format
			ok(JSON.stringify({ html_url: 'https://x/issues/7#issuecomment-1' })),
		);
		const result = addComment(run, 7, 'hello');
		expect(result).toEqual({
			ok: true,
			value: 'https://x/issues/7#issuecomment-1',
		});
		expect(calls[0]?.args).toEqual([
			'api',
			'-X',
			'POST',
			'repos/threadwick-hq/threadwick/issues/7/comments',
			'--input',
			'-',
		]);
		expect(parseStdin(calls[0]?.stdin)).toEqual({ body: 'hello' });
	});

	it('returns an empty string when the response has no html_url', () => {
		const { run } = stubRunner(ok('{}'));
		const result = addComment(run, 7, 'hello');
		expect(result).toEqual({ ok: true, value: '' });
	});
});

describe('addLabels', () => {
	it('POSTs the labels array', () => {
		const { run, calls } = stubRunner(ok('{}'));
		const result = addLabels(run, 7, ['blocked', 'area:repo']);
		expect(result).toEqual({ ok: true, value: undefined });
		expect(calls[0]?.args).toEqual([
			'api',
			'-X',
			'POST',
			'repos/threadwick-hq/threadwick/issues/7/labels',
			'--input',
			'-',
		]);
		expect(parseStdin(calls[0]?.stdin)).toEqual({
			labels: ['blocked', 'area:repo'],
		});
	});
});

describe('removeLabel', () => {
	it('sends a DELETE with the label URL-encoded and no stdin', () => {
		const { run, calls } = stubRunner(ok(''));
		const result = removeLabel(run, 7, 'area:apps/web');
		expect(result).toEqual({ ok: true, value: undefined });
		expect(calls[0]?.args).toEqual([
			'api',
			'-X',
			'DELETE',
			'repos/threadwick-hq/threadwick/issues/7/labels/area%3Aapps%2Fweb',
		]);
		expect(calls[0]?.stdin).toBeUndefined();
	});

	it('wraps a failure with the gh failure hint', () => {
		const { run } = stubRunner(fail('HTTP 404: Not Found'));
		const result = removeLabel(run, 7, 'blocked');
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error).toContain('Not Found');
	});
});

describe('issueDatabaseId', () => {
	it('requests the .id jq field and parses it as an integer', () => {
		const { run, calls } = stubRunner(ok('123456\n'));
		const result = issueDatabaseId(run, 7);
		expect(result).toEqual({ ok: true, value: 123456 });
		expect(calls[0]?.args).toEqual([
			'api',
			'repos/threadwick-hq/threadwick/issues/7',
			'--jq',
			'.id',
		]);
	});

	it('fails when the output is not a safe integer', () => {
		const { run } = stubRunner(ok('not-a-number\n'));
		const result = issueDatabaseId(run, 7);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error).toContain('could not resolve database id for #7');
	});
});

describe('addBlockedBy', () => {
	it('resolves the blocker database id, then POSTs issue_id', () => {
		const { run, calls } = queueRunner([ok('999\n'), ok('{}')]);
		const result = addBlockedBy(run, 10, 5);
		expect(result).toEqual({ ok: true, value: undefined });
		expect(calls).toHaveLength(2);
		expect(calls[0]?.args).toEqual([
			'api',
			'repos/threadwick-hq/threadwick/issues/5',
			'--jq',
			'.id',
		]);
		expect(calls[1]?.args).toEqual([
			'api',
			'-X',
			'POST',
			'repos/threadwick-hq/threadwick/issues/10/dependencies/blocked_by',
			'--input',
			'-',
		]);
		// biome-ignore lint/style/useNamingConvention: GitHub API wire format
		expect(parseStdin(calls[1]?.stdin)).toEqual({ issue_id: 999 });
	});

	it('short-circuits without a second call when the id lookup fails', () => {
		const { run, calls } = queueRunner([fail('HTTP 404: Not Found')]);
		const result = addBlockedBy(run, 10, 5);
		expect(result.ok).toBe(false);
		expect(calls).toHaveLength(1);
	});
});

describe('removeBlockedBy', () => {
	it('resolves the blocker database id, then sends a DELETE', () => {
		const { run, calls } = queueRunner([ok('999\n'), ok('')]);
		const result = removeBlockedBy(run, 10, 5);
		expect(result).toEqual({ ok: true, value: undefined });
		expect(calls[1]?.args).toEqual([
			'api',
			'-X',
			'DELETE',
			'repos/threadwick-hq/threadwick/issues/10/dependencies/blocked_by/999',
		]);
		expect(calls[1]?.stdin).toBeUndefined();
	});
});

describe('milestoneNumberForPhase', () => {
	it('finds the milestone number matching "Phase N"', () => {
		const { run, calls } = stubRunner(
			ok(
				JSON.stringify([
					{ title: 'Phase 0', number: 1 },
					{ title: 'Phase 2', number: 3 },
				]),
			),
		);
		const result = milestoneNumberForPhase(run, 2);
		expect(result).toEqual({ ok: true, value: 3 });
		expect(calls[0]?.args).toEqual([
			'api',
			'repos/threadwick-hq/threadwick/milestones?state=all&per_page=100',
		]);
	});

	it('fails with a bootstrap hint when the phase milestone is absent', () => {
		const { run } = stubRunner(
			ok(JSON.stringify([{ title: 'Phase 0', number: 1 }])),
		);
		const result = milestoneNumberForPhase(run, 5);
		expect(result).toEqual({
			ok: false,
			error: 'milestone "Phase 5" not found (run bootstrap)',
		});
	});
});

describe('resolveProject', () => {
	it('finds the project by title and returns number/id', () => {
		const { run, calls } = stubRunner(
			ok(
				JSON.stringify({
					projects: [
						{ number: 3, id: 'PVT_x', title: 'Threadwick Work' },
						{ number: 9, id: 'PVT_y', title: 'Other' },
					],
				}),
			),
		);
		const result = resolveProject(run);
		expect(result).toEqual({ ok: true, value: { number: 3, id: 'PVT_x' } });
		expect(calls[0]?.args).toEqual([
			'project',
			'list',
			'--owner',
			'threadwick-hq',
			'--limit',
			'100',
			'--format',
			'json',
		]);
	});

	it('fails with a bootstrap hint when the project is not found', () => {
		const { run } = stubRunner(ok(JSON.stringify({ projects: [] })));
		const result = resolveProject(run);
		expect(result).toEqual({
			ok: false,
			error: 'project "Threadwick Work" not found (run bootstrap)',
		});
	});
});

describe('resolvePriorityField', () => {
	const project = { number: 3, id: 'PVT_x' };

	it('finds the Priority field and builds the option-id map', () => {
		const { run, calls } = stubRunner(
			ok(
				JSON.stringify({
					fields: [
						{
							id: 'FIELD_1',
							name: 'Priority',
							options: [
								{ id: 'OPT_P0', name: 'p0' },
								{ id: 'OPT_P1', name: 'p1' },
							],
						},
					],
				}),
			),
		);
		const result = resolvePriorityField(run, project);
		expect(result).toEqual({
			ok: true,
			value: {
				fieldId: 'FIELD_1',
				optionIds: { p0: 'OPT_P0', p1: 'OPT_P1' },
			},
		});
		expect(calls[0]?.args).toEqual([
			'project',
			'field-list',
			'3',
			'--owner',
			'threadwick-hq',
			'--limit',
			'100',
			'--format',
			'json',
		]);
	});

	it('fails with a bootstrap hint when the Priority field is missing', () => {
		const { run } = stubRunner(ok(JSON.stringify({ fields: [] })));
		const result = resolvePriorityField(run, project);
		expect(result).toEqual({
			ok: false,
			error: 'field "Priority" not found (run bootstrap)',
		});
	});
});

describe('setIssuePriority', () => {
	const project = { number: 3, id: 'PVT_x' };
	const field = {
		fieldId: 'FIELD_1',
		optionIds: { p0: 'OPT_P0', p1: 'OPT_P1' },
	};

	it('adds the item to the project then edits the single-select field', () => {
		const { run, calls } = queueRunner([
			ok(JSON.stringify({ id: 'ITEM_1' })),
			ok('{}'),
		]);
		const result = setIssuePriority(run, project, field, 'https://x/1', 'p1');
		expect(result).toEqual({ ok: true, value: undefined });
		expect(calls[0]?.args).toEqual([
			'project',
			'item-add',
			'3',
			'--owner',
			'threadwick-hq',
			'--url',
			'https://x/1',
			'--format',
			'json',
		]);
		expect(calls[1]?.args).toEqual([
			'project',
			'item-edit',
			'--id',
			'ITEM_1',
			'--project-id',
			'PVT_x',
			'--field-id',
			'FIELD_1',
			'--single-select-option-id',
			'OPT_P1',
		]);
	});

	it('fails without calling gh when the priority has no known option id', () => {
		const { run, calls } = stubRunner(ok('{}'));
		const result = setIssuePriority(run, project, field, 'https://x/1', 'p3');
		expect(result).toEqual({
			ok: false,
			error: 'priority option "p3" not found',
		});
		expect(calls).toHaveLength(0);
	});

	it('fails when the created item id is unreadable', () => {
		const { run, calls } = stubRunner(ok('{}'));
		const result = setIssuePriority(run, project, field, 'https://x/1', 'p0');
		expect(result).toEqual({
			ok: false,
			error: 'project item id was unreadable',
		});
		expect(calls).toHaveLength(1);
	});
});

describe('ensureAreaLabels', () => {
	it('skips existing labels and creates the rest with the standard color', () => {
		const { run, calls } = queueRunner([
			ok('area:repo\n'),
			...Array.from({ length: 9 }, () => ok('{}')),
		]);
		const result = ensureAreaLabels(run);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value).toContain('label area:repo: exists');
		expect(result.value).toContain('label area:apps/studio: created');
		const createCall = calls.find(
			(call) => call.args[3] === 'repos/threadwick-hq/threadwick/labels',
		);
		expect(createCall?.args).toEqual([
			'api',
			'-X',
			'POST',
			'repos/threadwick-hq/threadwick/labels',
			'--input',
			'-',
		]);
		expect(parseStdin(createCall?.stdin)).toEqual({
			name: 'area:apps/studio',
			color: '1d76db',
			description: 'Work area: apps/studio',
		});
	});

	it('propagates a failure reading the existing label list', () => {
		const { run } = stubRunner(fail('HTTP 401: Bad credentials'));
		const result = ensureAreaLabels(run);
		expect(result.ok).toBe(false);
	});
});

describe('ensureMilestones', () => {
	it('skips existing phases and creates the missing ones', () => {
		const { run, calls } = queueRunner([
			ok('Phase 0\n'),
			...Array.from({ length: 8 }, () => ok('{}')),
		]);
		const result = ensureMilestones(run);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value).toContain('milestone Phase 0: exists');
		expect(result.value).toContain('milestone Phase 1: created');
		const createCall = calls.find(
			(call) => call.args[3] === 'repos/threadwick-hq/threadwick/milestones',
		);
		expect(parseStdin(createCall?.stdin)).toEqual({
			title: 'Phase 1',
			description: 'MIGRATION.md phase 1',
		});
	});
});

describe('ensureIssueTypes', () => {
	it('reports the API as unavailable with a manual-step hint on failure', () => {
		const { run } = stubRunner(fail('HTTP 404: Not Found'));
		const result = ensureIssueTypes(run);
		expect(result.available).toBe(false);
		expect(result.lines[0]).toContain('issue types: API unavailable');
		expect(result.lines.some((line) => line.includes('manual step'))).toBe(
			true,
		);
	});

	it('skips existing types and creates the missing ones with per-type colors', () => {
		const { run, calls } = queueRunner([
			ok(JSON.stringify([{ name: 'Feature' }])),
			...Array.from({ length: 5 }, () => ok('{}')),
		]);
		const result = ensureIssueTypes(run);
		expect(result.available).toBe(true);
		expect(result.lines).toContain('issue type Feature: exists');
		expect(result.lines).toContain('issue type Bug: created');
		const bugCall = calls.find((call) => {
			const payload =
				call.stdin === undefined ? undefined : JSON.parse(call.stdin);
			return (
				payload !== null &&
				typeof payload === 'object' &&
				(payload as Record<string, unknown>).name === 'Bug'
			);
		});
		expect(parseStdin(bugCall?.stdin)).toEqual({
			name: 'Bug',
			description: 'Work type: Bug',
			// biome-ignore lint/style/useNamingConvention: GitHub API wire format
			is_enabled: true,
			color: 'red',
		});
	});

	it('marks available=false and adds a manual step when one creation fails', () => {
		const { run } = queueRunner([
			ok(JSON.stringify([])),
			ok('{}'), // Feature
			fail('HTTP 422'), // Bug fails
			ok('{}'), // Refactor
			ok('{}'), // Chore
			ok('{}'), // Docs
			ok('{}'), // Test
		]);
		const result = ensureIssueTypes(run);
		expect(result.available).toBe(false);
		expect(result.lines).toContain('issue type Bug: FAILED (HTTP 422)');
		expect(
			result.lines.some((line) => line.includes('manual step: org Settings')),
		).toBe(true);
	});
});

describe('ensureProject', () => {
	it('returns the existing project without creating one', () => {
		const { run, calls } = stubRunner(
			ok(
				JSON.stringify({
					projects: [{ number: 3, id: 'PVT_x', title: 'Threadwick Work' }],
				}),
			),
		);
		const result = ensureProject(run);
		expect(result).toEqual({ ok: true, value: { number: 3, id: 'PVT_x' } });
		expect(calls).toHaveLength(1);
	});

	it('creates the project, links it to the repo, and returns the resolved ref', () => {
		const { run, calls } = queueRunner([
			ok(JSON.stringify({ projects: [] })), // resolveProject: not found
			ok(JSON.stringify({ number: 3, id: 'PVT_x' })), // project create
			ok(
				JSON.stringify({
					projects: [{ number: 3, id: 'PVT_x', title: 'Threadwick Work' }],
				}),
			), // resolveProject again
			ok('{}'), // project link (best-effort)
		]);
		const result = ensureProject(run);
		expect(result).toEqual({ ok: true, value: { number: 3, id: 'PVT_x' } });
		expect(calls[1]?.args).toEqual([
			'project',
			'create',
			'--owner',
			'threadwick-hq',
			'--title',
			'Threadwick Work',
			'--format',
			'json',
		]);
		expect(calls[3]?.args).toEqual([
			'project',
			'link',
			'3',
			'--owner',
			'threadwick-hq',
			'--repo',
			'threadwick-hq/threadwick',
		]);
	});
});

describe('ensurePriorityField', () => {
	const project = { number: 3, id: 'PVT_x' };

	it('returns the existing field without creating one', () => {
		const { run, calls } = stubRunner(
			ok(
				JSON.stringify({
					fields: [{ id: 'FIELD_1', name: 'Priority', options: [] }],
				}),
			),
		);
		const result = ensurePriorityField(run, project);
		expect(result.ok).toBe(true);
		expect(calls).toHaveLength(1);
	});

	it('creates the field with the priority options when absent', () => {
		const { run, calls } = queueRunner([
			ok(JSON.stringify({ fields: [] })), // resolvePriorityField: not found
			ok('{}'), // field-create
			ok(
				JSON.stringify({
					fields: [{ id: 'FIELD_1', name: 'Priority', options: [] }],
				}),
			), // resolvePriorityField again
		]);
		const result = ensurePriorityField(run, project);
		expect(result.ok).toBe(true);
		expect(calls[1]?.args).toEqual([
			'project',
			'field-create',
			'3',
			'--owner',
			'threadwick-hq',
			'--name',
			'Priority',
			'--data-type',
			'SINGLE_SELECT',
			'--single-select-options',
			'p0,p1,p2,p3',
		]);
	});
});

describe('probeDependencies', () => {
	it('reports unavailable with no sample issue and does not call gh', () => {
		const { run, calls } = stubRunner(ok(''));
		const result = probeDependencies(run, undefined);
		expect(result.available).toBe(false);
		expect(result.line).toContain('no issue to probe against yet');
		expect(calls).toHaveLength(0);
	});

	it('reports available when the endpoint answers ok', () => {
		const { run, calls } = stubRunner(ok('[]'));
		const result = probeDependencies(run, 7);
		expect(result).toEqual({
			available: true,
			line: 'dependencies: native blocked-by API available',
		});
		expect(calls[0]?.args).toEqual([
			'api',
			'repos/threadwick-hq/threadwick/issues/7/dependencies/blocked_by?per_page=1',
		]);
	});

	it('falls back to the label with a hint when the endpoint fails', () => {
		const { run } = stubRunner(fail('HTTP 404: Not Found'));
		const result = probeDependencies(run, 7);
		expect(result.available).toBe(false);
		expect(result.line).toContain('falling back to the "blocked" label');
		expect(result.line).toContain('Not Found');
	});
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { GhResult, GhRunner } from './gh';
import type { Result, WorkCache } from './types';

// The cache module resolves a real file path via `git rev-parse` and touches
// disk; commands.ts must never hit the real shared cache during tests, so
// readCache/writeCache are stubbed while the pure helpers stay real.
const readCacheMock = vi.fn<() => Result<WorkCache>>();
const writeCacheMock = vi.fn<(cache: WorkCache) => Result<undefined>>();

vi.mock('./cache', async (importOriginal) => {
	const actual = await importOriginal<typeof import('./cache')>();
	return {
		...actual,
		readCache: readCacheMock,
		writeCache: writeCacheMock,
	};
});

const { runBlock, runCheck, runClaim, runGate, runUnblock } = await import(
	'./commands'
);

function noCache(): Result<WorkCache> {
	return { ok: false, error: 'no cache at /tmp/work-cache.json' };
}

/** Builds one GraphQL issue node with realistic defaults, per github.test.ts. */
function issueNode(
	overrides: Record<string, unknown> = {},
): Record<string, unknown> {
	return {
		number: 7,
		title: 'Example issue',
		url: 'https://github.com/threadwick-hq/threadwick/issues/7',
		state: 'OPEN',
		stateReason: null,
		createdAt: '2026-07-01T00:00:00Z',
		updatedAt: '2026-07-01T00:00:00Z',
		body: '<!-- work:v1 test -->\n\n## Context\n\nhi\n\n## Plan\n\nreal plan',
		author: { login: 'eiluviann', __typename: 'User' },
		authorAssociation: 'MEMBER',
		editor: null,
		issueType: { name: 'Chore' },
		blockedByIssues: { nodes: [] },
		assignees: { nodes: [] },
		labels: { nodes: [{ name: 'area:repo' }] },
		milestone: { title: 'Phase 0' },
		closedByPullRequestsReferences: { nodes: [] },
		projectItems: {
			nodes: [
				{
					project: { number: 3 },
					fieldValueByName: { name: 'p1' },
				},
			],
		},
		comments: { nodes: [] },
		...overrides,
	};
}

function graphqlPage(nodes: unknown[]): string {
	return JSON.stringify({ data: { repository: { issues: { nodes } } } });
}

/**
 * A GhRunner answering the fetchSnapshot call sequence from fixtures.
 *
 * dependencyMode: 'label' simulates a repo with neither native GraphQL nor
 * REST dependency support: the first GraphQL attempt (which requests
 * blockedByIssues) fails with a field error, forcing a query retry without
 * it, and the REST blocked_by probe then 404s, landing fetchSnapshot on the
 * label fallback — the same probing sequence github.ts performs for real.
 */
const NOT_FOUND: GhResult = {
	ok: false,
	error: { message: 'HTTP 404: Not Found', exitCode: 1 },
};

const projectListResult: GhResult = {
	ok: true,
	value: JSON.stringify({
		projects: [{ number: 3, title: 'Threadwick Work', id: 'PVT_x' }],
	}),
};

function viewerLoginResult(login: string): GhResult {
	return login.length > 0
		? { ok: true, value: `${login}\n` }
		: { ok: false, error: { message: 'no viewer', exitCode: 1 } };
}

function unexpectedCall(joined: string): GhResult {
	return {
		ok: false,
		error: { message: `unexpected call: ${joined}`, exitCode: 1 },
	};
}

function snapshotRunner(
	nodes: unknown[],
	options: { viewerLogin?: string; dependencyMode?: 'label' } = {},
): GhRunner {
	const viewerLogin = options.viewerLogin ?? 'eiluviann';
	let graphqlAttempts = 0;
	const isLabelMode = options.dependencyMode === 'label';
	return (args) => {
		const joined = args.join(' ');
		if (joined.startsWith('api user')) return viewerLoginResult(viewerLogin);
		if (joined.startsWith('api graphql')) {
			graphqlAttempts += 1;
			if (isLabelMode && graphqlAttempts === 1) {
				return {
					ok: false,
					error: { message: 'Field blockedBy does not exist', exitCode: 1 },
				};
			}
			return { ok: true, value: graphqlPage(nodes) };
		}
		if (
			isLabelMode &&
			args[0] === 'api' &&
			/dependencies\/blocked_by/.test(args[1] ?? '')
		) {
			return NOT_FOUND;
		}
		if (args[0] === 'project') return projectListResult;
		return unexpectedCall(joined);
	};
}

/** Wraps a snapshot runner, recording every call and layering extra routes on top. */
function recordingRunner(
	base: GhRunner,
	extra: (
		args: readonly string[],
		stdin: string | undefined,
	) => GhResult | undefined,
): {
	run: GhRunner;
	calls: { args: readonly string[]; stdin: string | undefined }[];
} {
	const calls: { args: readonly string[]; stdin: string | undefined }[] = [];
	const run: GhRunner = (args, stdin) => {
		calls.push({ args, stdin });
		const overridden = extra(args, stdin);
		if (overridden !== undefined) return overridden;
		return base(args, stdin);
	};
	return { run, calls };
}

/** process.exit throws this sentinel instead of terminating the test worker. */
class ProcessExitSentinel extends Error {
	readonly code: number | undefined;
	constructor(code: number | undefined) {
		super(`process.exit(${String(code)})`);
		this.code = code;
	}
}

let exitSpy: ReturnType<typeof spyOnProcessExit>;
let errorSpy: ReturnType<typeof spyOnConsoleError>;
let logSpy: ReturnType<typeof spyOnConsoleLog>;

function spyOnProcessExit() {
	return vi
		.spyOn(process, 'exit')
		.mockImplementation((code?: string | number | null | undefined) => {
			throw new ProcessExitSentinel(
				typeof code === 'number' ? code : undefined,
			);
		});
}

function spyOnConsoleError() {
	return vi.spyOn(console, 'error').mockImplementation(() => undefined);
}

function spyOnConsoleLog() {
	return vi.spyOn(console, 'log').mockImplementation(() => undefined);
}

beforeEach(() => {
	readCacheMock.mockReset().mockReturnValue(noCache());
	writeCacheMock.mockReset().mockReturnValue({ ok: true, value: undefined });
	exitSpy = spyOnProcessExit();
	errorSpy = spyOnConsoleError();
	logSpy = spyOnConsoleLog();
});

afterEach(() => {
	vi.restoreAllMocks();
});

function stderrText(): string {
	return errorSpy.mock.calls.map((call) => String(call[0])).join('\n');
}

describe('runClaim', () => {
	it('refuses when the issue is not triaged', () => {
		const node = issueNode({
			number: 20,
			labels: { nodes: [] },
			milestone: null,
			issueType: null,
			projectItems: { nodes: [] },
		});
		const run = snapshotRunner([node]);
		expect(() => runClaim(run, ['20'])).toThrow(ProcessExitSentinel);
		expect(exitSpy).toHaveBeenCalledWith(1);
		expect(stderrText()).toContain('not triaged');
	});

	it('refuses when the issue status is not backlog (already assigned)', () => {
		const node = issueNode({
			number: 21,
			assignees: { nodes: [{ login: 'someone-else' }] },
		});
		const run = snapshotRunner([node]);
		expect(() => runClaim(run, ['21'])).toThrow(ProcessExitSentinel);
		expect(exitSpy).toHaveBeenCalledWith(1);
		expect(stderrText()).toContain('only backlog issues can be claimed');
		expect(stderrText()).toContain('"active"');
	});

	it('refuses when the issue is blocked (also not backlog)', () => {
		const node = issueNode({
			number: 22,
			blockedByIssues: { nodes: [{ number: 5, state: 'OPEN' }] },
		});
		const run = snapshotRunner([node]);
		expect(() => runClaim(run, ['22'])).toThrow(ProcessExitSentinel);
		expect(stderrText()).toContain('only backlog issues can be claimed');
		expect(stderrText()).toContain('"blocked"');
	});

	it('refuses while offline (snapshot served from cache)', () => {
		readCacheMock.mockReturnValue({
			ok: true,
			value: {
				version: 1,
				cursors: {},
				snapshot: {
					fetchedAt: '2026-07-01T00:00:00Z',
					repo: 'threadwick-hq/threadwick',
					viewerLogin: 'eiluviann',
					dependencyMode: 'graphql',
					issueTypesAvailable: true,
					projectNumber: 3,
					issues: [],
				},
			},
		});
		const offline: GhRunner = () => ({
			ok: false,
			error: { message: 'ENOTFOUND api.github.com', exitCode: 1 },
		});
		expect(() => runClaim(offline, ['23'])).toThrow(ProcessExitSentinel);
		expect(exitSpy).toHaveBeenCalledWith(1);
		expect(stderrText()).toContain('cannot claim while offline');
	});

	it('assigns the viewer and refreshes the cache on success', () => {
		const node = issueNode({ number: 24 });
		const { run, calls } = recordingRunner(snapshotRunner([node]), (args) => {
			if (
				args[0] === 'api' &&
				args[2] === 'POST' &&
				/\/assignees$/.test(args[3] ?? '')
			) {
				return { ok: true, value: '{}' };
			}
			return undefined;
		});
		runClaim(run, ['24']);
		expect(exitSpy).not.toHaveBeenCalled();
		const assignCall = calls.find((call) =>
			(call.args[3] ?? '').endsWith('/assignees'),
		);
		expect(assignCall?.args).toEqual([
			'api',
			'-X',
			'POST',
			'repos/threadwick-hq/threadwick/issues/24/assignees',
			'--input',
			'-',
		]);
		expect(assignCall?.stdin).toBeDefined();
		expect(JSON.parse(assignCall?.stdin ?? '{}')).toEqual({
			assignees: ['eiluviann'],
		});
		expect(logSpy.mock.calls.flat().join('\n')).toContain(
			'claimed #24 for eiluviann',
		);
		// refreshCache re-fetches a snapshot and writes it — pin the written
		// payload (not just "was called": loadSnapshot also writes).
		const lastWrite = writeCacheMock.mock.calls.at(-1)?.[0];
		expect(lastWrite?.snapshot.issues.map((issue) => issue.number)).toEqual([
			24,
		]);
	});
});

describe('runGate --pr', () => {
	function prView(body: string): GhRunner {
		return (args) => {
			if (args[0] === 'pr' && args[1] === 'view') {
				return { ok: true, value: JSON.stringify({ body }) };
			}
			return { ok: false, error: { message: 'unexpected call', exitCode: 1 } };
		};
	}

	function combine(prRunner: GhRunner, closedIssueRunner: GhRunner): GhRunner {
		return (args, stdin) => {
			if (args[0] === 'pr') return prRunner(args, stdin);
			return closedIssueRunner(args, stdin);
		};
	}

	/** Resolves the -F number=<n> arg passed to the single-issue GraphQL query. */
	function issueNumberArg(args: readonly string[]): number {
		const numberArg = args.find((arg) => arg.startsWith('number='));
		return numberArg === undefined
			? Number.NaN
			: Number.parseInt(numberArg.slice('number='.length), 10);
	}

	function singleIssueResult(
		nodesByNumber: Record<number, Record<string, unknown>>,
		args: readonly string[],
	): GhResult {
		const number = issueNumberArg(args);
		const node = nodesByNumber[number];
		if (node === undefined) {
			return {
				ok: false,
				error: { message: `no fixture for issue #${number}`, exitCode: 1 },
			};
		}
		return {
			ok: true,
			value: JSON.stringify({ data: { repository: { issue: node } } }),
		};
	}

	/** Serves fetchSingleIssue's single-issue GraphQL query from a number->node map. */
	function fetchSingleIssueRunner(
		nodesByNumber: Record<number, Record<string, unknown>>,
	): GhRunner {
		return (args) => {
			const joined = args.join(' ');
			if (joined.startsWith('api user')) return viewerLoginResult('eiluviann');
			// fetchSingleIssue first tries the open-issues snapshot (empty here),
			// then falls back to the single-issue GraphQL query, keyed by -F number=.
			if (joined.startsWith('api graphql') && joined.includes('$endCursor')) {
				return { ok: true, value: graphqlPage([]) };
			}
			if (joined.startsWith('api graphql')) {
				return singleIssueResult(nodesByNumber, args);
			}
			if (args[0] === 'project') return projectListResult;
			return unexpectedCall(joined);
		};
	}

	function plannedIssue(number: number): Record<string, unknown> {
		return issueNode({
			number,
			assignees: { nodes: [{ login: 'eiluviann' }] },
		});
	}

	it.each([
		'Closes #7',
		'closes #7',
		'Closed #7',
		'Fixes #7',
		'fixed #7',
		'Resolves #7',
		'resolved #7',
		'CLOSES #7',
	])('matches the auto-close keyword linkage in %j', (body) => {
		const run = combine(
			prView(body),
			fetchSingleIssueRunner({ 7: plannedIssue(7) }),
		);
		runGate(run, ['--pr', '99']);
		expect(exitSpy).not.toHaveBeenCalled();
		expect(logSpy.mock.calls.flat().join('\n')).toContain('closes #7');
	});

	it('matches every reference in a body that closes multiple issues', () => {
		const run = combine(
			prView('Closes #7 and fixes #9'),
			fetchSingleIssueRunner({ 7: plannedIssue(7), 9: plannedIssue(9) }),
		);
		runGate(run, ['--pr', '99']);
		expect(exitSpy).not.toHaveBeenCalled();
		const output = logSpy.mock.calls.flat().join('\n');
		expect(output).toContain('#7');
		expect(output).toContain('#9');
	});

	it('fails when the PR body has no Closes/Fixes/Resolves reference', () => {
		const run = prView('This PR does some stuff, see #7 for context.');
		expect(() => runGate(run, ['--pr', '99'])).toThrow(ProcessExitSentinel);
		expect(exitSpy).toHaveBeenCalledWith(1);
		expect(stderrText()).toContain('no "Closes #<issue>" reference');
	});

	it('validates every referenced issue is assigned and planned', () => {
		const unassigned = issueNode({
			number: 7,
			assignees: { nodes: [] },
		});
		const run = combine(
			prView('Closes #7'),
			fetchSingleIssueRunner({ 7: unassigned }),
		);
		expect(() => runGate(run, ['--pr', '99'])).toThrow(ProcessExitSentinel);
		expect(exitSpy).toHaveBeenCalledWith(1);
		expect(stderrText()).toContain('#7 is unassigned — claim it first');
	});

	it('fails when the linked issue Plan section is not filled', () => {
		const unplanned = issueNode({
			number: 7,
			assignees: { nodes: [{ login: 'eiluviann' }] },
			body: '<!-- work:v1 test -->\n\n## Context\n\nhi\n\n## Plan\n\n_Filled at claim time, before implementation: chosen approach, sub-tasks in order, risks._',
		});
		const run = combine(
			prView('Closes #7'),
			fetchSingleIssueRunner({ 7: unplanned }),
		);
		expect(() => runGate(run, ['--pr', '99'])).toThrow(ProcessExitSentinel);
		expect(exitSpy).toHaveBeenCalledWith(1);
		expect(stderrText()).toContain('Plan section is not filled');
	});

	it('reports both problems together when an issue is unassigned and unplanned', () => {
		const raw = issueNode({
			number: 7,
			assignees: { nodes: [] },
			body: '<!-- work:v1 test -->\n\n## Context\n\nhi\n\n## Plan\n\n_Filled at claim time, before implementation: chosen approach, sub-tasks in order, risks._',
		});
		const run = combine(
			prView('Closes #7'),
			fetchSingleIssueRunner({ 7: raw }),
		);
		expect(() => runGate(run, ['--pr', '99'])).toThrow(ProcessExitSentinel);
		expect(stderrText()).toContain('#7 is unassigned');
		expect(stderrText()).toContain('Plan section is not filled');
	});

	it('rejects a --pr flag that is not a number', () => {
		const run: GhRunner = () => ({
			ok: false,
			error: { message: 'should not be called', exitCode: 1 },
		});
		expect(() => runGate(run, ['--pr', 'nope'])).toThrow(ProcessExitSentinel);
		expect(exitSpy).toHaveBeenCalledWith(2);
	});

	it('succeeds and logs every closed issue number when all are valid', () => {
		const run = combine(
			prView('Closes #7, closes #7'),
			fetchSingleIssueRunner({ 7: plannedIssue(7) }),
		);
		runGate(run, ['--pr', '99']);
		expect(exitSpy).not.toHaveBeenCalled();
		expect(logSpy.mock.calls.flat().join('\n')).toContain('gate ok');
	});
});

describe('runBlock / runUnblock', () => {
	it('runBlock uses the native dependency mutation when dependencyMode is not label', () => {
		const node = issueNode({ number: 30 });
		const { run, calls } = recordingRunner(snapshotRunner([node]), (args) => {
			if (
				args[0] === 'api' &&
				/\/issues\/5$/.test(args[1] ?? '') &&
				args.includes('--jq')
			) {
				return { ok: true, value: '555\n' };
			}
			if (
				args[0] === 'api' &&
				args[2] === 'POST' &&
				/dependencies\/blocked_by$/.test(args[3] ?? '')
			) {
				return { ok: true, value: '{}' };
			}
			return undefined;
		});
		runBlock(run, ['30', '--on', '5']);
		expect(exitSpy).not.toHaveBeenCalled();
		const dependencyCall = calls.find((call) =>
			(call.args[3] ?? '').endsWith('/dependencies/blocked_by'),
		);
		expect(dependencyCall).toBeDefined();
		expect(JSON.parse(dependencyCall?.stdin ?? '{}')).toEqual({
			// biome-ignore lint/style/useNamingConvention: GitHub API wire format
			issue_id: 555,
		});
		const labelCall = calls.find(
			(call) =>
				call.args[0] === 'api' && (call.args[3] ?? '').endsWith('/labels'),
		);
		expect(labelCall).toBeUndefined();
		expect(logSpy.mock.calls.flat().join('\n')).toContain(
			'#30 is now blocked by #5',
		);
	});

	it('runBlock falls back to the blocked label when dependencyMode is label', () => {
		const node = issueNode({ number: 31 });
		const { run, calls } = recordingRunner(
			snapshotRunner([node], { dependencyMode: 'label' }),
			(args) => {
				if (
					args[0] === 'api' &&
					args[2] === 'POST' &&
					/\/labels$/.test(args[3] ?? '')
				) {
					return { ok: true, value: '{}' };
				}
				if (
					args[0] === 'api' &&
					args[2] === 'POST' &&
					/\/comments$/.test(args[3] ?? '')
				) {
					return { ok: true, value: '{}' };
				}
				return undefined;
			},
		);
		runBlock(run, ['31', '--on', '5']);
		expect(exitSpy).not.toHaveBeenCalled();
		const labelCall = calls.find((call) =>
			(call.args[3] ?? '').endsWith('/labels'),
		);
		expect(labelCall).toBeDefined();
		expect(JSON.parse(labelCall?.stdin ?? '{}')).toEqual({
			labels: ['blocked'],
		});
		const commentCall = calls.find((call) =>
			(call.args[3] ?? '').endsWith('/comments'),
		);
		expect(JSON.parse(commentCall?.stdin ?? '{}')).toEqual({
			body: 'Blocked by #5.',
		});
		const dependencyCall = calls.find((call) =>
			(call.args[3] ?? '').endsWith('/dependencies/blocked_by'),
		);
		expect(dependencyCall).toBeUndefined();
		expect(logSpy.mock.calls.flat().join('\n')).toContain('label mode');
	});

	it('runUnblock removes the native dependency when dependencyMode is not label', () => {
		const node = issueNode({ number: 32 });
		const { run, calls } = recordingRunner(snapshotRunner([node]), (args) => {
			if (
				args[0] === 'api' &&
				/\/issues\/5$/.test(args[1] ?? '') &&
				args.includes('--jq')
			) {
				return { ok: true, value: '555\n' };
			}
			if (
				args[0] === 'api' &&
				args[2] === 'DELETE' &&
				/dependencies\/blocked_by\/555$/.test(args[3] ?? '')
			) {
				return { ok: true, value: '' };
			}
			return undefined;
		});
		runUnblock(run, ['32', '--on', '5']);
		expect(exitSpy).not.toHaveBeenCalled();
		const deleteCall = calls.find(
			(call) =>
				call.args[2] === 'DELETE' &&
				(call.args[3] ?? '').includes('blocked_by/555'),
		);
		expect(deleteCall).toBeDefined();
	});

	it('runUnblock removes the blocked label when dependencyMode is label', () => {
		const node = issueNode({ number: 33 });
		const { run, calls } = recordingRunner(
			snapshotRunner([node], { dependencyMode: 'label' }),
			(args) => {
				if (
					args[0] === 'api' &&
					args[2] === 'DELETE' &&
					/\/labels\/blocked$/.test(args[3] ?? '')
				) {
					return { ok: true, value: '' };
				}
				return undefined;
			},
		);
		runUnblock(run, ['33']);
		expect(exitSpy).not.toHaveBeenCalled();
		const deleteCall = calls.find(
			(call) =>
				call.args[2] === 'DELETE' &&
				(call.args[3] ?? '').endsWith('/labels/blocked'),
		);
		expect(deleteCall).toBeDefined();
		expect(logSpy.mock.calls.flat().join('\n')).toContain(
			'removed blocked label',
		);
	});
});

describe('runCheck', () => {
	it('splits bare (untriaged) issues from partial-triage violations, and exits 0 with no violations', () => {
		const bare = issueNode({
			number: 40,
			labels: { nodes: [] },
			milestone: null,
			issueType: null,
			projectItems: { nodes: [] },
			body: 'plain body with no marker',
		});
		const run = snapshotRunner([bare]);
		runCheck(run, []);
		expect(exitSpy).not.toHaveBeenCalled();
		const output = logSpy.mock.calls.flat().join('\n');
		expect(output).toContain('awaiting triage — #40');
		expect(errorSpy.mock.calls.flat().join('\n')).not.toContain('violation');
	});

	it('reports a violation (not bare) and exits 1 when partially triaged with a real problem', () => {
		const partiallyTriaged = issueNode({
			number: 41,
			// Has area + milestone + work marker, but missing type -> not "bare".
			issueType: null,
		});
		const run = snapshotRunner([partiallyTriaged]);
		expect(() => runCheck(run, [])).toThrow(ProcessExitSentinel);
		expect(exitSpy).toHaveBeenCalledWith(1);
		const errOutput = stderrText();
		expect(errOutput).toContain('violation — #41');
		expect(errOutput).toContain('missing issue type');
	});

	it('exits 0 (no violations) when every issue is fully triaged', () => {
		const clean = issueNode({ number: 42 });
		const run = snapshotRunner([clean]);
		runCheck(run, []);
		expect(exitSpy).not.toHaveBeenCalled();
	});

	it('emits JSON with violations/untriaged arrays when --json is passed', () => {
		const bare = issueNode({
			number: 43,
			labels: { nodes: [] },
			milestone: null,
			issueType: null,
			projectItems: { nodes: [] },
			body: 'no marker here',
		});
		const run = snapshotRunner([bare]);
		runCheck(run, ['--json']);
		const jsonLine = logSpy.mock.calls
			.map((call) => String(call[0]))
			.find((line) => line.trim().startsWith('{'));
		expect(jsonLine).toBeDefined();
		const parsed: unknown = JSON.parse(jsonLine ?? '{}');
		expect(parsed).toMatchObject({
			violations: [],
			untriaged: [expect.stringContaining('#43')],
		});
	});
});

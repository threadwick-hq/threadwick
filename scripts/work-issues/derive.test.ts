import { describe, expect, it } from 'vitest';
import { type DeriveInput, deriveStatus } from './derive';

function input(overrides: Partial<DeriveInput> = {}): DeriveInput {
	return {
		state: 'OPEN',
		stateReason: undefined,
		assigneeCount: 0,
		hasOpenLinkedPullRequest: false,
		unresolvedBlockerCount: 0,
		...overrides,
	};
}

describe('deriveStatus', () => {
	it('derives backlog for an open unassigned issue', () => {
		expect(deriveStatus(input())).toBe('backlog');
	});

	it('derives active for an open assigned issue', () => {
		expect(deriveStatus(input({ assigneeCount: 1 }))).toBe('active');
	});

	it('derives review when an open linked PR exists', () => {
		expect(
			deriveStatus(input({ assigneeCount: 1, hasOpenLinkedPullRequest: true })),
		).toBe('review');
	});

	it('derives blocked over review and active when blockers are unresolved', () => {
		expect(
			deriveStatus(
				input({
					assigneeCount: 1,
					hasOpenLinkedPullRequest: true,
					unresolvedBlockerCount: 2,
				}),
			),
		).toBe('blocked');
	});

	it('ignores resolved blockers', () => {
		expect(
			deriveStatus(input({ assigneeCount: 1, unresolvedBlockerCount: 0 })),
		).toBe('active');
	});

	it('derives done for closed-as-completed regardless of other signals', () => {
		expect(
			deriveStatus(
				input({
					state: 'CLOSED',
					stateReason: 'COMPLETED',
					unresolvedBlockerCount: 3,
					hasOpenLinkedPullRequest: true,
				}),
			),
		).toBe('done');
	});

	it('derives done for closed without a reason', () => {
		expect(deriveStatus(input({ state: 'CLOSED' }))).toBe('done');
	});

	it('derives abandoned for closed-as-not-planned', () => {
		expect(
			deriveStatus(input({ state: 'CLOSED', stateReason: 'NOT_PLANNED' })),
		).toBe('abandoned');
	});
});

/**
 * Status derivation from native GitHub signals. Status is never stored, so it
 * can never go stale; this function is the single definition of the mapping.
 */

import type { WorkStatus } from './types';

export type DeriveInput = {
	state: 'OPEN' | 'CLOSED';
	stateReason: string | undefined;
	assigneeCount: number;
	hasOpenLinkedPullRequest: boolean;
	unresolvedBlockerCount: number;
};

/**
 * Derives work status in precedence order: closed reason first, then unresolved
 * blockers, then an open linked PR, then assignment.
 */
export function deriveStatus(input: DeriveInput): WorkStatus {
	if (input.state === 'CLOSED') {
		return input.stateReason === 'NOT_PLANNED' ? 'abandoned' : 'done';
	}
	if (input.unresolvedBlockerCount > 0) return 'blocked';
	if (input.hasOpenLinkedPullRequest) return 'review';
	if (input.assigneeCount > 0) return 'active';
	return 'backlog';
}

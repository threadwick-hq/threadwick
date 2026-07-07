import { isRavelryEnabled } from '@threadwick/core/capabilities';
import {
	type MakerStatus,
	makerStatusToRavelry,
	type RavelryStatus,
	ravelryStatusToMaker,
} from '@threadwick/types';

/** In-memory fixture store — live Ravelry API lands in a later task. */
const fixtureStatuses = new Map<string, RavelryStatus>();

export function pushProjectStatusToRavelry(
	ravelryProjectId: string,
	status: MakerStatus,
): void {
	if (!isRavelryEnabled()) return;
	fixtureStatuses.set(ravelryProjectId, makerStatusToRavelry(status));
}

export function pullProjectStatusFromRavelry(
	ravelryProjectId: string,
): MakerStatus | undefined {
	if (!isRavelryEnabled()) return undefined;
	const remote = fixtureStatuses.get(ravelryProjectId);
	return remote ? ravelryStatusToMaker(remote) : undefined;
}

/** Test-only — reset fixture state. */
export function resetRavelryFixture(): void {
	fixtureStatuses.clear();
}

export function readRavelryFixtureStatus(
	ravelryProjectId: string,
): RavelryStatus | undefined {
	return fixtureStatuses.get(ravelryProjectId);
}

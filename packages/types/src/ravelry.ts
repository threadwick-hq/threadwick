import type { MakerStatus, RavelryStatus } from './pattern';
import { MAKER_STATUS_TO_RAVELRY, RAVELRY_STATUS_TO_MAKER } from './pattern';

/** Threadwick maker status → Ravelry project status (§5 push map). */
export function makerStatusToRavelry(status: MakerStatus): RavelryStatus {
	return MAKER_STATUS_TO_RAVELRY[status];
}

/** Ravelry project status → Threadwick maker status (§5 pull map; Hibernating → on-hold). */
export function ravelryStatusToMaker(status: RavelryStatus): MakerStatus {
	return RAVELRY_STATUS_TO_MAKER[status];
}

/** Whether a remote Ravelry status differs from the local maker status after mapping. */
export function ravelryStatusDiffersFromMaker(
	local: MakerStatus,
	remote: RavelryStatus,
): boolean {
	return ravelryStatusToMaker(remote) !== local;
}

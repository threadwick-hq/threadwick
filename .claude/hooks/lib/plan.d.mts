// Type surface of plan.mjs for the TypeScript parity test (plan-parity.test.ts).
export type WorkIssueLike = {
	number?: number;
	state?: string;
	assignees?: readonly string[];
	body?: string;
};
export type WorkCacheLike = {
	snapshot?: { issues?: readonly WorkIssueLike[]; viewerLogin?: string };
};
export declare function planFilled(body: unknown): boolean;
export declare function readWorkCache(
	cachePath: string | undefined,
): WorkCacheLike | undefined;
export declare function activeIssues(
	cache: WorkCacheLike | undefined,
): WorkIssueLike[];
export declare function unplannedIssues(
	active: readonly WorkIssueLike[],
): WorkIssueLike[];

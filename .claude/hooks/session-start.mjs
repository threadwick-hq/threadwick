// SessionStart — inject active/next work-issue context for Claude Code.
// Reads only the shared work cache (written by every `pnpm run work` command);
// never touches the network, so sessions start fast and offline-safe.
// Entry point: session-start.sh (thin shim; keeps hook wiring paths stable).
import { resolveWorkCachePath } from './lib/git.mjs';
import { activeIssues, readWorkCache, unplannedIssues } from './lib/plan.mjs';

const out = ['## Work tracking (GitHub Issues)', ''];

const cache = readWorkCache(resolveWorkCachePath());
if (cache === undefined) {
	out.push(
		'No work cache yet. Fetch the current work state first:',
		'  pnpm run work list',
	);
	emit();
} else {
	const snapshot = cache.snapshot ?? {};
	const issues = Array.isArray(snapshot.issues) ? snapshot.issues : [];
	const active = activeIssues(cache);

	if (active.length > 0) {
		out.push('**Active issue(s):**');
		for (const issue of active) {
			out.push(`- #${issue.number} ${issue.title} (${issue.status})`);
		}
		out.push(
			'',
			'Continue the active issue. Read it with `pnpm run work show <number>`.',
		);
		const unplanned = unplannedIssues(active);
		if (unplanned.length > 0) {
			out.push('', '**PLAN REQUIRED before writing implementation files.**');
			for (const issue of unplanned) {
				out.push(`#${issue.number} has an unfilled Plan section.`);
			}
			out.push('1. Use plan mode (strong model)');
			out.push(
				'2. pnpm run work plan <number>  (plan text on stdin or --file)',
			);
			out.push('3. The require-plan hook blocks writes until this is done.');
		}
		const cutoff = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
		const stale = active.filter((issue) => (issue.updatedAt ?? '') < cutoff);
		if (stale.length > 0) {
			out.push('', '**STALE ACTIVE ISSUE(S)** (no update >3 days):');
			for (const issue of stale) out.push(`  #${issue.number}`);
		}
	} else {
		const order = { p0: 0, p1: 1, p2: 2, p3: 3 };
		const next = issues
			.filter((issue) => issue.status === 'backlog' && issue.triaged === true)
			.sort(
				(a, b) =>
					(order[a.priority] ?? 4) - (order[b.priority] ?? 4) ||
					String(a.createdAt).localeCompare(String(b.createdAt)),
			)[0];
		if (next !== undefined) {
			out.push(
				'**No active issue.** Next claimable:',
				`- #${next.number} ${next.title} (${next.priority ?? '?'})`,
				'',
				'Claim with `pnpm run work claim <number>` before implementing.',
			);
		} else {
			out.push(
				'No claimable backlog issue in the cache.',
				'  Refresh: pnpm run work list',
				'  Create:  pnpm run work new --title "..." --type feat --area repo',
			);
		}
	}

	if (typeof snapshot.fetchedAt === 'string') {
		out.push(
			'',
			`_Cache from ${snapshot.fetchedAt}; any work command refreshes it._`,
		);
	}
	emit();
}

function emit() {
	out.push(
		'',
		'See `AGENTS.md` for the lifecycle. Commands: `pnpm run work <cmd>`.',
	);
	console.log(
		JSON.stringify({
			hookSpecificOutput: {
				hookEventName: 'SessionStart',
				additionalContext: out.join('\n'),
			},
		}),
	);
}

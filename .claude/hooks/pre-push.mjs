// Git pre-push logic: blocks push when the viewer's assigned issue has an
// unfilled Plan section (read from the shared work cache; no network).
// Entry point: pre-push (bash shim wired via `git config core.hooksPath`).
import { resolveWorkCachePath } from './lib/git.mjs';
import { activeIssues, readWorkCache, unplannedIssues } from './lib/plan.mjs';

const cache = readWorkCache(resolveWorkCachePath());
if (cache === undefined) process.exit(0); // missing/unreadable cache never blocks a push

const active = activeIssues(cache);
if (active.length === 0) process.exit(0);

const unplanned = unplannedIssues(active);
if (unplanned.length === active.length) {
	process.stderr.write(
		'pre-push: assigned issue(s) have an unfilled Plan — fill before pushing:\n' +
			unplanned
				.map((issue) => `  pnpm run work plan ${issue.number}`)
				.join('\n') +
			'\n',
	);
	process.exit(1);
}

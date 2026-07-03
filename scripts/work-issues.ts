/**
 * work-issues.ts — the issue-first work CLI (TW-054).
 *
 * GitHub Issues are the source of truth for work tracking. Status is derived
 * from native signals (assignee, linked PRs, blocked-by dependencies, closed
 * state), never stored. Untrusted content (non-member authors on this public
 * repo) is quarantined before it can reach agent context.
 *
 * Subcommands:
 *   bootstrap                    provision labels, milestones, issue types, project + Priority field
 *   new --title "..." [--type T] [--area A]... [--phase N] [--priority P] [--context s] [--scope s] [--accept c]...
 *   claim <number>               assign yourself (backlog + triaged only)
 *   block <number> --on <m>      add a blocked-by relationship
 *   unblock <number> --on <m>    remove a blocked-by relationship
 *   list [--status S] [--type T] [--area A] [--phase N] [--json]
 *   next [--area A] [--phase N]  top claimable issue by priority then age
 *   show <number> [--md|--json]  issue details / read-only markdown snapshot
 *   update <number> --section S [--file f]   rewrite one body section (stdin without --file)
 *   plan <number> [--file f] [--alternatives-file f]   fill the Plan section
 *   log <number> "message"       append a progress comment
 *   inbox [<number>] [--peek]    trusted comments since the per-issue cursor
 *   check [--json]               validate open issues carry the work shape
 *
 * Runs via `pnpm run work2 <command>` until the TW-055 cutover renames it.
 */

import {
	runBlock,
	runBootstrap,
	runCheck,
	runClaim,
	runInbox,
	runList,
	runLog,
	runNew,
	runNext,
	runPlan,
	runShow,
	runUnblock,
	runUpdate,
} from './work-issues/commands';
import { runGh } from './work-issues/gh';

main();

function main(): void {
	const [command, ...rest] = process.argv.slice(2);
	switch (command) {
		case 'bootstrap':
			runBootstrap(runGh);
			return;
		case 'new':
			runNew(runGh, rest);
			return;
		case 'claim':
			runClaim(runGh, rest);
			return;
		case 'block':
			runBlock(runGh, rest);
			return;
		case 'unblock':
			runUnblock(runGh, rest);
			return;
		case 'list':
			runList(runGh, rest);
			return;
		case 'next':
			runNext(runGh, rest);
			return;
		case 'show':
			runShow(runGh, rest);
			return;
		case 'update':
			runUpdate(runGh, rest);
			return;
		case 'plan':
			runPlan(runGh, rest);
			return;
		case 'log':
			runLog(runGh, rest);
			return;
		case 'inbox':
			runInbox(runGh, rest);
			return;
		case 'check':
			runCheck(runGh, rest);
			return;
		default:
			printUsage();
			process.exit(command === undefined || command === 'help' ? 0 : 2);
	}
}

function printUsage(): void {
	console.log(`work (issue-first) — GitHub Issues are the source of truth

  bootstrap                     provision labels, milestones, issue types, project
  new --title "..." [flags]     create a work issue (work:v1 body)
  claim <number>                assign yourself (backlog + triaged only)
  block <number> --on <m>       mark blocked by #m
  unblock <number> --on <m>     remove the blocked-by relationship
  list [--status|--type|--area|--phase] [--json]
  next [--area] [--phase]       top claimable issue
  show <number> [--md|--json]   details or read-only markdown snapshot
  update <number> --section S   rewrite one body section (stdin or --file)
  plan <number>                 fill the Plan section (stdin or --file)
  log <number> "message"        append a progress comment
  inbox [<number>] [--peek]     new trusted comments since last read
  check [--json]                validate open issues carry the work shape`);
}

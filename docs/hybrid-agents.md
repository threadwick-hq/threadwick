# Hybrid agent workflow

Threadwick's lifecycle ([AGENTS.md](../AGENTS.md)) is tool-agnostic by design: the issue body is
the spec and plan, the `work` CLI is the interface, and the gates live in git, CI, and the shared
work cache. This doc defines the contract that lets more than one agent work that same lifecycle
without weakening any gate. The reference pairing is a strong hosted model as planner/reviewer
(Claude Code) and a local model as implementer (OpenCode); the contract applies to any agent that
satisfies the checklist at the bottom.

## Roles

| Role | Model class | Owns |
| --- | --- | --- |
| Planner/reviewer | strong hosted model | triage, specs, plans, architecture, debugging, code review of every hybrid PR |
| Implementer | local coding model | implementation of issues whose Plan meets the handoff bar below |
| Utility | small local model | session titles, summaries, autocomplete, embeddings — never implementation code |

Both primary roles work the same issue through the same lifecycle; the issue body is the only
handoff channel. Comments carry progress (`work log`), never spec.

## Task routing — route by risk, not size

| Work | Route | Why |
| --- | --- | --- |
| Triage, spec writing, `work plan` | planner | judgment |
| Architecture, public API, data-model changes | planner | blast radius |
| Debugging with unknown cause | planner | open search space |
| Security-sensitive code, auth, CI and workflow config | planner | risk |
| Code review of every hybrid diff | planner | quality backstop |
| Implementation from a Plan meeting the handoff bar | implementer | verifiable, gated |
| Tests against behavior specified in the issue | implementer | spec'd |
| Bug fix where the failing repro test already exists | implementer | spec'd by the repro |
| Mechanical refactors, boilerplate, doc drafts from an outline | implementer | gates catch errors cheaply |
| Titles, summaries, autocomplete, embeddings | utility | no code ownership |

When in doubt, route up: rework costs more than the routing saved.

## Lifecycle ownership

The numbered lifecycle in [AGENTS.md](../AGENTS.md), annotated with the owning role:

| Step | Owner |
| --- | --- |
| 1–2 pick and claim | planner |
| 3 plan (plan mode, strong model — already required) | planner |
| 4 branch · 5 implement + draft PR | implementer |
| 6 code review | planner |
| 7 finish (acceptance, ready) · 8 merge · 9 cleanup | either |

## Handoff contract (the plan quality bar)

An issue may be routed to the implementer only when its Plan section contains:

- the exact files to create or change;
- the function and type signatures (or component contracts) to introduce;
- ordered sub-tasks, each touching one file cluster;
- for each Acceptance item, the test or check that proves it.

If the Plan does not meet the bar, the implementer must not start — log a comment
(`work log`) and send it back for planning. Handoff happens entirely through the issue body and
the `work` CLI; no side channels.

## Escalation rules

- **Two strikes.** If the implementer fails the same sub-task twice (gate failure or review
  finding), the planner takes the issue over. Never a third iteration on the same failure.
- **Out-of-plan discovery.** If implementation needs files the Plan does not name, or the Plan
  turns out to be wrong, stop and escalate for a re-plan. Improvising beyond the plan defeats
  the review model.
- Escalations are logged on the issue (`work log`) so routing quality stays measurable.

## Gate coverage

| Gate | Mechanism | Claude Code | OpenCode | Catches |
| --- | --- | --- | --- | --- |
| Plan before edits | shared work cache | `require-plan.sh` (PreToolUse) | `workflow-gates.js` (`tool.execute.before`) | implementing without a spec |
| Plan before push | git pre-push hook via `core.hooksPath` | shared | shared | unplanned pushes |
| Types + tests at turn end | changed-file `tsc --noEmit` + `vitest related` | `stop-quality-gate-repo.mjs` (Stop; one forced fix round) | same script via the `session.idle` event (notify-only) | broken TS or tests |
| Issue shape + PR gate | CI `work check`, `work gate --pr` | shared | shared | process drift |
| Build, typecheck, lint | CI turbo + biome | shared | shared | mechanical errors |
| Logic and design | PR review by the planner | n/a | n/a | implementer mistakes |

The OpenCode end-of-turn gate is notify-only (OpenCode has no forced-continuation semantics);
the pre-push hook, CI, and PR review are the hard backstops behind it.

## OpenCode specifics

- [`opencode.json`](../opencode.json) loads the workspace-local `AGENTS.md` files (the root and
  container ones load via OpenCode's parent-directory traversal) and sets the bash permission
  policy: allow the pnpm/git/gh loop, deny obviously destructive shapes (`--force` pushes, `+`
  force-refspecs, `--hard` resets, `rm -rf`), ask otherwise. Rules are evaluated
  last-match-wins, so the denies sit below the broad allows and the `--force-with-lease`
  re-allow sits below the `--force` deny. This is an accident guardrail, not a security
  boundary — glob command matching is inherently porous (an unusual quoting or a novel
  destructive command can slip it); the real protections are the git pre-push hook, CI, and
  human review.
- [`.opencode/plugins/workflow-gates.js`](../.opencode/plugins/workflow-gates.js) ports the two
  Claude-Code-specific gates; its decision logic is covered by
  [`scripts/workflow-gates.test.ts`](../scripts/workflow-gates.test.ts). The end-of-turn gate is
  wired through OpenCode's generic `event` hook (branching on `session.idle`), since OpenCode has
  no dedicated stop hook. An edit-class tool with no resolvable file path (e.g. the multi-file
  `patch` tool) still faces the plan condition, so it cannot bypass the plan-before-edit gate.
- Model and provider config is personal (endpoints, keys, model choice) and lives in
  `~/.config/opencode/opencode.json` — never in the repo.

## Second-agent requirements

Any agent joining this repo must:

- read `AGENTS.md` (and the workspace-local ones) before touching code;
- use the `work` CLI for all issue state (claim, plan, log, update), which also inherits the
  trust and quarantine model for non-member content;
- respect the plan-before-edit gate against the shared work cache;
- push through the git pre-push hook (never `--no-verify`);
- open and update draft PRs per the git workflow, and never merge while draft or before review
  and CI pass;
- have every diff reviewed by the planner role before the PR leaves draft.

# Work tracking

Every unit of work in this repo is one markdown file in `work/`, tracked in git. The file is the
spec, the documentation, and the audit trail. There is no external tracker to keep in sync: git is
the source of truth, and GitHub is a read-only mirror generated from these files.

This is the system for an agent-built repo. An agent can claim, record, document, and close work
with nothing but file edits and git. No credentials, no API, no network beyond `git push`.

## The unit of work

One file per task: `work/TW-<NNN>-<kebab-slug>.md`. The id is monotonic and never reused. Status
lives **only** in frontmatter; the file never moves. See `_TEMPLATE.md` for the full schema.

Key fields:

- `id` — `TW-NNN`, immutable, matches the filename.
- `type` — `feat | fix | refactor | chore | docs | test`.
- `area` — one or more workspaces: `apps/studio apps/web packages/{config,core,editor,icons,org,types} repo` (`repo` = root/tooling/CI).
- `phase` — `0..8`, the MIGRATION.md phase this belongs to.
- `status` — `backlog | active | review | done | blocked | abandoned`.
- `priority` — `p0` (highest) .. `p3`.
- `acceptance` — testable criteria; mirrored as a checklist in the body.

## Lifecycle

```
backlog -> active -> review -> done
              |         |
              v         v
           blocked   (back to active on changes-requested)
              |
              v
          abandoned   (terminal; crashed or superseded runs)
```

- `backlog` — spec exists, unclaimed.
- `active` — an agent holds it (`assignee` + `started` set).
- `review` — a PR is open (`pr` set), awaiting the owner.
- `done` — merged (`completed` + `pr` set). Enforced, not trusted (see Gates).
- `blocked` — waiting on `blocked_by` ids.
- `abandoned` — terminal; a crashed or superseded run.

## How an agent works a task

1. **Pick up.** `pnpm run work next --area packages/core` prints the top claimable backlog task.
   Edit its frontmatter to `status: active`, set `assignee` and `started`, branch
   `feat/TW-NNN-slug`, commit `docs(work): claim TW-NNN`. Two agents racing the same id collide at
   `git push`; the loser re-runs `next`.
2. **Record.** The file travels on the branch. Tick the body checklist and append to `## Log` as you
   go. End every commit with `Refs TW-NNN`.
3. **Document.** The body is the durable record: context, scope, decisions, log. It is reviewed in
   the PR diff alongside the code.
4. **Close.** Set `status: review`, fill `pr`, open the PR with `Closes TW-NNN` in the body. The PR is
   squash-merged with `Closes TW-NNN` in the squash commit message; set `status: done` and `completed`
   in the same PR. CI enforces that the status and the closing commit agree.

## Gates (`pnpm run work check`, hard-blocking in CI)

- Frontmatter is valid: required fields present, enums correct, id matches filename, ids unique.
- Status invariants: `active` has `started`; `review`/`done` have `pr`; `done` has `completed`;
  `blocked` has `blocked_by`; every `blocked_by` id exists.
- **Derivation gate (status is derived, not trusted):** a `done` task must be referenced by a real
  commit, and any id a commit closes (`Closes TW-NNN`) must actually be `done`. You cannot mark
  something done without shipping it, and you cannot ship a close without the status following.
- `INDEX.md` is regenerated and must not be stale.

## Visibility

- `INDEX.md` (generated, committed) is the at-a-glance table. Never hand-edit it; run
  `pnpm run work index`.
- A GitHub Projects board (read-only mirror) is upserted from merged frontmatter for roadmap and
  mobile steering. Nothing writes back to git from it.

The owner steers by editing `priority` / `phase` in a small PR, and by reviewing the PR queue.

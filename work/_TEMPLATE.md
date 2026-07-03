---
id: TW-000
title: <one-line imperative summary>
type: feat            # feat | fix | refactor | chore | docs | test
area:                 # one or more of: apps/studio apps/web packages/{config,core,editor,icons,org,types} repo
  - repo
phase: 0              # 0..8, maps to a MIGRATION.md phase
status: backlog       # backlog | active | review | done | blocked | abandoned
priority: p2          # p0 (highest) .. p3
created: 2026-01-01   # ISO date
# assignee: agent     # set on backlog -> active
# started:            # ISO date, set on backlog -> active
# completed:          # ISO date, set on -> done
# pr:                 # PR number, set on -> review
# blocked_by:         # list of TW-ids this waits on (required when status: blocked)
#   - TW-000
acceptance:
  - <testable criterion>
# links:              # optional touched paths / urls
#   - path/to/file
---

## Context

Why this exists. Link the MIGRATION.md phase if relevant.

## Scope

In: ...
Out: ...

## Plan

<!-- Switch to plan mode (claude-opus-4-8) and fill this section before writing any implementation
     files. Describe: chosen approach, sub-tasks in order, key technical decisions, known risks.
     The require-plan hook blocks Write/Edit of non-work files until this section is non-empty. -->

## Alternatives considered

<!-- Ruled-out approaches and the one-line reason each was rejected. Bullets. -->

## Acceptance

- [ ] <mirror of frontmatter acceptance, ticked as criteria pass>

## Code review

<!-- Populated after running /code-review ultra post-implementation. Leave empty until then.
     Paste the summary findings here and note which were addressed before merge. -->

## Log

- 2026-01-01 created.

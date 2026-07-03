---
description: Push the current task branch, open/refresh its PR, wait for CI, then squash-merge per the work convention
---

Ship the current branch following the AGENTS.md lifecycle. If $ARGUMENTS names a PR number or
issue number, operate on that instead of inferring from the branch (branches are
`feat/<issue>-slug`).

1. **Preconditions.** Not on `main`; working tree committed; the issue is assigned to you and
   its Plan section is filled (`pnpm run work show <n>` reports `plan: filled`).
2. **Verify locally** with the CI-parity gates: `pnpm run work check`,
   `pnpm run typecheck:scripts && pnpm run test:scripts` (when repo tooling changed),
   `pnpm turbo run typecheck test --continue`, `pnpm biome check packages`.
3. **Push + PR.** `git push -u origin HEAD`; create a draft PR with `gh pr create --draft` if
   none exists, with `Closes #<n>` in the body. Verify the gate passes:
   `pnpm run work gate --pr <pr-number>`.
4. **CI loop.** `gh pr checks --watch`; fix failures with commit + push until green.
5. **Finalize.** Tick the verified Acceptance boxes in the issue body
   (`pnpm run work update <n> --section Acceptance`) and log completion
   (`pnpm run work log <n> "..."`). There is no status field to set — status is derived.
6. **Merge.** `gh pr ready`, then `gh pr merge --squash` keeping `Closes #<n>` in the squash
   message — GitHub closes the issue automatically on merge. Afterwards
   `git checkout main && git pull --ff-only`, and if a task worktree exists,
   `bash scripts/cleanup-worktree.sh <n>` (from inside `main/`).

Never merge while checks are red or the PR is draft. Stop and report instead of forcing anything.

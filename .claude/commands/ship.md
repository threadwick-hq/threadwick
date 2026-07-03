---
description: Push the current task branch, open/refresh its PR, wait for CI, then squash-merge per the work convention
---

Ship the current branch following the AGENTS.md lifecycle. If $ARGUMENTS names a PR number or
TW-NNN id, operate on that instead of inferring from the branch.

1. **Preconditions.** Not on `main`; working tree committed; the task's plan is filled
   (`pnpm run work validate-plan TW-NNN`).
2. **Verify locally** with the CI-parity gates: `pnpm run work check`,
   `pnpm turbo run typecheck test --continue`, `pnpm biome check packages`.
3. **Push + PR.** `git push -u origin HEAD`; create a draft PR with `gh pr create --draft` if none
   exists (`Refs TW-NNN` in the body).
4. **Mark review.** Set the task file's `pr:` number and `status: review`, run
   `pnpm run work index`, commit `docs(work): mark TW-NNN review with PR #N`, push.
5. **CI loop.** `gh pr checks --watch`; fix failures with commit + push until green.
6. **Finalize on the branch.** Set `status: done` + `completed:` and tick verified acceptance
   boxes in a final commit (branch commits carry `Refs TW-NNN`, so the derivation gate stays
   green), push, wait for CI.
7. **Merge.** `gh pr ready`, then `gh pr merge --squash` with `Closes TW-NNN` in the squash
   message. Afterwards `git checkout main && git pull --ff-only`, and if a `TW-NNN/` worktree
   exists, `bash scripts/cleanup-worktree.sh TW-NNN` (from inside `main/`).

Never merge while checks are red or the PR is draft. Stop and report instead of forcing anything.

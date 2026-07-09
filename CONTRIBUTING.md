# Contributing to Threadwick

Thanks for your interest in Threadwick. A few essentials before you start.

## License

Threadwick is open source under **GNU AGPL-3.0-or-later**. By contributing, you agree that your
contributions are licensed under those terms, and you agree to the
[Contributor License Agreement](CLA.md).

## Contributor License Agreement (CLA)

Threadwick uses a lightweight CLA so the project's licensing stays clear and adaptable over time. In
plain terms: **you keep ownership of your work**, you license it to Threadwick and to everyone under
the AGPL, and you allow Threadwick to keep the project's licensing coherent — including adapting it in
the future (for example, offering the same code under additional terms). The full text is in
[CLA.md](CLA.md); please read it.

Right now Threadwick is built by its owner and AI agents and is **not accepting outside pull
requests**, so the CLA is dormant. When that changes, first-time contributors will be asked to accept
it automatically (via CLA Assistant) on their first pull request.

## How we work

- Every piece of work — feature, fix, refactor — is one **GitHub Issue** on this repo. The issue
  body is the spec (Context, Scope, Acceptance, Plan), edited in place as things change; comments
  carry the conversation. There is no separate tracker to keep in sync.
- Status is **derived from native GitHub state, never stored**: assignment means active, an open
  linked PR means in review, the closed reason records done or abandoned. Don't add status labels
  or status fields.
- The `pnpm run work` CLI is the day-to-day interface — `work new` to open an issue,
  `work claim <n>` to take one, `work plan <n>` to record the plan before implementing,
  `work log <n>` for progress. Humans can equally use the GitHub UI and the "Threadwick Work"
  project board.
- Branch as `feat/<issue-number>-slug`, open a **draft PR on the first commit** with
  `Closes #<issue-number>` in the body, and squash-merge once review and CI pass — GitHub closes
  the issue automatically.
- Run `pnpm check` (typecheck, lint, test) and `pnpm run work check` before pushing.
- The full lifecycle, invariants, and environment gotchas are specified in [AGENTS.md](AGENTS.md).

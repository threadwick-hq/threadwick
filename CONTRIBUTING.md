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

- Every piece of work — feature, fix, refactor — is one file in [`work/`](work/README.md), tracked in
  git as `work/TW-NNN-*.md`. It is the spec, the documentation, and the audit trail; there is no
  external issue tracker to keep in sync.
- Claim a task by setting its `status: active`; reference it from every commit (`Refs TW-NNN`) and
  close it from the pull request (`Closes TW-NNN`). CI enforces that a `done` task is backed by a real
  commit and that anything a commit closes is actually `done`.
- Work-bearing PRs are **squash-merged**. Put `Closes TW-NNN` in the squash commit message so the
  derivation gate sees the closing reference on `main`.
- Run `pnpm check` (typecheck, lint, test) and `pnpm run work check` before pushing.

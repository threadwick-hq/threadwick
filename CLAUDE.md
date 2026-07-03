# CLAUDE.md

The repo's agent guidance is tool-agnostic and lives in `AGENTS.md`. Claude Code reads it via the
import below — keep the content there, not duplicated here.

@AGENTS.md

## Claude Code specifics

- **Hooks:** [`.claude/settings.json`](.claude/settings.json) wires four hooks (scripts in
  [`.claude/hooks/`](.claude/hooks/)):
  - `SessionStart` → `session-start.sh` injects the active/next task, plan warning, and stale alert.
  - `PreToolUse` (Write|Edit) → `require-plan.sh` blocks writes to non-work files until an active
    task exists and its `## Plan` section is non-empty.
  - `PostToolUse` (Write|Edit) → `work-index-reminder.sh` regenerates `work/INDEX.md` after a
    `work/TW-*.md` file changes.
  - `Stop` → `stop-quality-gate-repo.mjs` runs the owning package's `tsc --noEmit` + `vitest
    related` for changed TS files across all worktrees before a session can finish.
- **Scoped guidance:** [`apps/studio/CLAUDE.md`](apps/studio/CLAUDE.md) imports the studio rules and
  loads automatically when you work under `apps/studio/`.

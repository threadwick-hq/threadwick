# CLAUDE.md

The repo's agent guidance is tool-agnostic and lives in `AGENTS.md`. Claude Code reads it via the
import below — keep the content there, not duplicated here.

@AGENTS.md

## Claude Code specifics

- **Hooks:** [`.claude/settings.json`](.claude/settings.json) wires three hooks (scripts in
  [`.claude/hooks/`](.claude/hooks/)); the work-related ones read only the shared work cache
  (`<git-common-dir>/work-cache.json`, refreshed by every `pnpm run work` command), never the
  network:
  - `SessionStart` → `session-start.sh` injects the assigned/next issue, plan warning, and stale
    alert from the cache.
  - `PreToolUse` (Write|Edit) → `require-plan.sh` blocks writes to implementation files until an
    issue is assigned to you and its Plan section is filled (fails open, loudly, when no cache
    exists yet).
  - `Stop` → `stop-quality-gate-repo.mjs` runs the owning package's `tsc --noEmit` + `vitest
    related` for changed TS files across all worktrees before a session can finish.
- **Scoped guidance:** [`apps/studio/CLAUDE.md`](apps/studio/CLAUDE.md) imports the studio rules and
  loads automatically when you work under `apps/studio/`.

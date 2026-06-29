# CLAUDE.md

The repo's agent guidance is tool-agnostic and lives in `AGENTS.md`. Claude Code reads it via the
import below — keep the content there, not duplicated here.

@AGENTS.md

## Claude Code specifics

- **MCP servers:** [`.mcp.json`](.mcp.json) at the repo root provides the Ant Design v5 docs server.
  Enable it when prompted, or run `claude mcp list`.
- **Hooks:** [`.claude/settings.json`](.claude/settings.json) wires two hooks (scripts in
  [`.claude/hooks/`](.claude/hooks/)):
  - `SessionStart` → `session-start.sh` injects the active/next work task at session start.
  - `PostToolUse` (Write|Edit) → `work-index-reminder.sh` regenerates `work/INDEX.md` after a
    `work/TW-*.md` file changes.
- **Scoped guidance:** [`apps/studio/CLAUDE.md`](apps/studio/CLAUDE.md) imports the studio rules and
  loads automatically when you work under `apps/studio/`.

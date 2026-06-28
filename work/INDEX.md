# Work index

Generated from `work/*.md` frontmatter by `scripts/work.ts`. Do not edit by hand; run `pnpm run work index`.

Totals: backlog 20 · active 0 · review 6 · done 19 · blocked 0 · abandoned 5

| ID | Title | Type | Area | Phase | Status | Priority | Assignee |
| --- | --- | --- | --- | --- | --- | --- | --- |
| TW-007 | Promote Biome from report-only to a hard CI gate | chore | repo, packages/config | 3 | backlog | p2 | - |
| TW-030 | Build the Follow chart pane (state styling, follow-position, zoom, tap-to-inspect) | feat | apps/web, packages/editor | 6 | review | p1 | agent |
| TW-031 | Wire the locked-responsive Follow shell across all five breakpoints plus Wake Lock | feat | apps/web, packages/core | 6 | review | p1 | agent |
| TW-032 | Add the external-pattern Follow fallback (Ravelry/PDF to checklist or open source) | feat | apps/web, packages/editor | 6 | review | p2 | agent |
| TW-033 | Build the Project interior shell, rail and pinned status tile | feat | apps/web, packages/core | 6 | review | p2 | agent |
| TW-034 | Build the Project Overview screen and Ravelry status mapping (capability-flagged) | feat | apps/web, packages/core, packages/types | 6 | review | p2 | agent |
| TW-035 | Add whole-pattern versioning, publish, remix and lineage types to @threadwick/types (Phase-7 anchor) | feat | packages/types | 6 | review | p2 | agent |
| TW-015 | Migrate ProjectView, ProjectsView and TopBar/VersionTag from AntD to shadcn | refactor | apps/studio | 6 | backlog | p2 | - |
| TW-016 | Replace App.useApp() with a shadcn toast and confirm layer and migrate AuthMenu | refactor | apps/studio, packages/core | 6 | backlog | p2 | - |
| TW-017 | Drop AntD from apps/studio and remove the theme and provider wiring | chore | apps/studio | 6 | backlog | p2 | - |
| TW-022 | Build the topbar with search/Cmd+K trigger, notifications bell and Import/New | feat | apps/web, packages/core, packages/icons | 6 | backlog | p2 | - |
| TW-023 | Implement the craft picker as a studio-wide persisted scope with inclusion semantics | feat | apps/web, packages/core, packages/types | 6 | backlog | p2 | - |
| TW-024 | Build the mobile bottom tab bar and responsive sidebar collapse | feat | apps/web, packages/core | 6 | backlog | p2 | - |
| TW-025 | Define the identity-tile slot-swap and breadcrumb contract for interiors (no layout shift) | feat | apps/web, packages/core | 6 | backlog | p2 | - |
| TW-039 | Add a recents and plain-language-state read model over patterns and projects | feat | apps/web, packages/editor | 6 | backlog | p2 | - |
| TW-040 | Add client-only Workbench list routes and shared PhotoCard/CardGrid/EmptyState primitives | feat | apps/web, packages/core | 6 | backlog | p2 | - |
| TW-041 | Build the Workbench Patterns and Projects lists bound to the top-level collections | feat | apps/web | 6 | backlog | p2 | - |
| TW-042 | Build the Home route (greeting, quick-start chips, Continue card and recents shelf) | feat | apps/web, packages/core | 6 | backlog | p2 | - |
| TW-043 | Add the Home second block (discovery/library), creator teaser and the decouple flag | feat | apps/web | 6 | backlog | p3 | - |
| TW-044 | Define the top-level Library model (StashYarn/OwnedTool/SavedPattern) and a decouplable Ravelry seam | feat | packages/types, packages/org | 6 | backlog | p2 | - |
| TW-045 | Build the craft-scoped Library store, sidebar counts and the three Library screens | feat | apps/web, packages/core, packages/icons | 6 | backlog | p2 | - |
| TW-046 | Add the runtime marketplace capability flag, MarketplaceGate and catalogue listing types | feat | packages/core, packages/types, apps/web | 6 | backlog | p2 | - |
| TW-047 | Build the Marketplace catalogue adapter and the Home and Browse routes (capability-gated) | feat | apps/web, packages/core, packages/types | 6 | backlog | p2 | - |
| TW-048 | Pin Supabase redirectTo to a fixed /studio/auth/callback | fix | apps/web, apps/studio | 6 | backlog | p2 | - |
| TW-049 | Audit and fix hardcoded /studio/ absolute asset paths in studio source | chore | apps/studio | 6 | backlog | p3 | - |
| TW-001 | Introduce the work/ tracking system | chore | repo | 6 | done | p1 | agent |
| TW-009 | Introduce @threadwick/i18n (enriched source + Claude translation pipeline + typed runtime + CI lint) | feat | packages/i18n, apps/web, repo | 6 | done | p1 | agent |
| TW-010 | Scaffold packages/editor and move the DOM-free chart core with its tests | refactor | packages/editor, apps/studio | 6 | done | p1 | agent |
| TW-011 | Move the store and imperative canvas controller into packages/editor behind an SSR-safe entry | refactor | packages/editor, apps/studio | 6 | done | p1 | agent |
| TW-012 | Move files.ts (import/export, SVG/PNG, print-PDF) into the editor browser-only entry | refactor | packages/editor, apps/studio | 6 | done | p2 | agent |
| TW-013 | Add the editor's action glyphs to @threadwick/icons and swap iconoir out of studio | feat | packages/icons, apps/studio | 6 | done | p1 | agent |
| TW-014 | Migrate the EditorView toolbar and inspector chrome from AntD to shadcn | refactor | apps/studio, packages/editor | 6 | done | p1 | agent |
| TW-018 | Bring the moved packages/editor code to Biome-clean | chore | packages/editor, packages/config, repo | 6 | done | p2 | agent |
| TW-019 | Mount /studio as a client-only RR7 route with isolated browser bootstrap | feat | apps/web, packages/editor | 6 | done | p1 | agent |
| TW-020 | Build the StudioShell layout route with the UWD cap-and-centre rule | feat | apps/web, packages/core | 6 | done | p1 | agent |
| TW-021 | Build the always-expanded sidebar nav with sections, counts and active state | feat | apps/web, packages/core, packages/icons | 6 | done | p1 | agent |
| TW-026 | Land the maker-plane Project model (references, progress, status, follow-mode) in @threadwick/types | feat | packages/types | 6 | done | p1 | agent |
| TW-027 | Build the instruction-decomposition engine (round to follow Units per granularity) | feat | packages/editor, packages/types | 6 | done | p1 | agent |
| TW-028 | Build the Follow progress state machine, Undo and aggregation (FILE_VERSION 3 to 4) | feat | packages/editor, packages/types | 6 | done | p1 | agent |
| TW-029 | Build the Follow instruction box, counter pills and mode selector (phone baseline) | feat | apps/web, packages/core | 6 | done | p1 | agent |
| TW-036 | Build the Pattern interior shell, rail and Overview (edit mode) in shadcn | feat | apps/web, packages/core, packages/icons | 6 | done | p2 | agent |
| TW-037 | Build the pinned version tile, publishing controls and reward-never-penalize quality checks | feat | apps/web, packages/core | 6 | done | p2 | agent |
| TW-038 | Build the Pattern view-mode decision surface and Start-making/Buy/Remix actions | feat | apps/web, packages/core | 6 | done | p2 | agent |
| TW-002 | Factor the editor/viewer out of apps/studio into packages/editor | refactor | apps/studio, packages/editor | 6 | abandoned | p1 | - |
| TW-003 | Migrate the editor chrome from AntD to shadcn | refactor | packages/editor, apps/studio | 6 | abandoned | p1 | - |
| TW-004 | Mount @threadwick/editor in apps/web as a client-only /studio route | feat | apps/web, packages/editor | 6 | abandoned | p1 | - |
| TW-005 | Pin Supabase redirectTo to a fixed /studio/auth/callback | fix | apps/web, apps/studio | 6 | abandoned | p2 | - |
| TW-006 | Audit studio source for hardcoded /studio/ absolute asset paths | chore | apps/studio | 6 | abandoned | p3 | - |
| TW-008 | Widen CI build/typecheck beyond packages/* to apps and root | chore | repo | 8 | backlog | p3 | - |
| TW-050 | Replace the Font-Awesome-derived Studio/Marketplace brand glyphs with originals (pre-public gate) | chore | packages/core | 8 | done | p1 | agent |

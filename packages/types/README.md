# @threadwick/types

Threadwick's shared TypeScript types — the **Pattern content model** (the canonical authoring
vocabulary). The same `Pattern` flows through Studio (author), Viewer (follow), and Marketplace
(list) without being re-modelled, so this is the interchange contract every surface shares.

Split out of `@threadwick/core` so surfaces can depend on the data contract without pulling the
design-system/token package.

## Install

```sh
npm install @threadwick/types
```

## Usage

```ts
import type { Pattern, Component, Material, Stitch } from '@threadwick/types';
```

A JSON-Schema mirror ships for fail-closed validation (agents / runtime):

```ts
import schema from '@threadwick/types/pattern.schema.json';
```

## Model

`Pattern` (the authored design) → `components`, `materials`, `tutorials`, `stitches`, `notes`,
`variations`, `overview`. `Component` → `artifacts` (`Chart | Written | Schematic`). Only
**authoring artifacts** (the sidebar tree) are modelled here; publishing/consumption chrome
(comments, ratings, ads, PDF export) is rendered by the platform.

`Project` (a **make**) → references one or more `Pattern`s **across crafts**, each via a
source-tagged `PatternReference` (`threadwick` internal id · `ravelry`/`blog` link · `pdf` file). A
make carries a `MakerStatus` (with quiet-colour + Ravelry-sync `const` maps), a per-reference follow
mode and a stored progress cursor (`unitAddress` is opaque — TW-027 owns its grammar, TW-028 the
advance/undo machine; overall progress is **derived**, never stored), plus the Materials & notes rail
(`yarns · tools · notes · photos`, each yarn/tool optionally linked _from stash_ via `stashId` →
TW-044) and a lightweight `customSections` escape hatch. This is the first **Phase-7** increment: the
maker plane references patterns, it never re-models pattern content; whole-pattern versioning/lineage
(TW-035) lives on the `Pattern`.

## License

AGPL-3.0-or-later © Threadwick.

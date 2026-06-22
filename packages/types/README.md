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

`Project` (a make) → references `Pattern`s. `Pattern` (the authored design) → `components`,
`materials`, `tutorials`, `stitches`, `notes`, `variations`, `overview`. `Component` → `artifacts`
(`Chart | Written | Schematic`). Only **authoring artifacts** (the sidebar tree) are modelled here;
publishing/consumption chrome (comments, ratings, ads, PDF export) is rendered by the platform.

## License

AGPL-3.0-or-later © Threadwick.

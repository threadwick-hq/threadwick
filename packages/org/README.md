# @threadwick/org

Threadwick's **org canon** — the single importable source of org-wide knowledge so every surface
(and every AI agent) acts from the same context instead of re-deriving it. Copy is imported, never
hand-typed (e.g. the marketing site's meta description and hero pull from `org.mission` /
`org.tagline`).

Split out of `@threadwick/core` so the knowledge base doesn't ride inside the design-system package.

## Install

```sh
npm install @threadwick/org
```

## Usage

```ts
import { mission, tagline, glossary, voice, legal, org } from '@threadwick/org';

mission.status; // 'confirmed' | 'draft'
mission.value;  // the text
```

Each fact is wrapped `confirmed(...)` / `draft(...)`. **Mission, vision, values, voice are
confirmed; brand/trademark, a formal privacy policy, and the legal entity remain `draft`** pending
owner sign-off. The prose canon mirrors this module in [`docs/org.md`](docs/org.md).

## License

AGPL-3.0-or-later © Threadwick.

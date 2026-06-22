# @threadwick/config

Threadwick's shared **code-shape** config so every repo's TypeScript, lint, and formatting match —
not just its colours. A new Threadwick app installs `@threadwick/core` + `@threadwick/config` and is
on-brand, on-grid, **and** lint-clean on day one, by default not by discipline.

## Install

```sh
npm install -D @threadwick/config
# peers: eslint ^9, prettier ^3, typescript ^5
```

## Usage

**tsconfig** — `tsconfig.json`:
```jsonc
{ "extends": "@threadwick/config/tsconfig.base.json", "include": ["src"] }
```

**ESLint** — `eslint.config.js`:
```js
import { base, noRawHex } from '@threadwick/config/eslint';
export default [
  ...base,
  { ignores: ['dist'] },
  // ban raw hex in product code; exempt generated token files
  { files: ['src/**/*.{ts,tsx}'], ignores: ['src/tokens/**'], ...noRawHex },
];
```

**Prettier** — `package.json`:
```json
{ "prettier": "@threadwick/config/prettier" }
```

## License

AGPL-3.0-or-later © Threadwick.

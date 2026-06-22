import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

/**
 * Shared base ESLint flat-config for Threadwick repos. Spread it into a repo's own
 * `eslint.config.js`, then add repo-specific blocks (ignores, the `noRawHex` rule with the
 * right `files`/`ignores`, etc.):
 *
 *   import { base, noRawHex } from '@threadwick/config/eslint';
 *   export default [
 *     ...base,
 *     { ignores: ['dist'] },
 *     { files: ['src/**'], ignores: ['src/tokens/**'], ...noRawHex },
 *   ];
 */
export const base = [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
];

/**
 * Fail-closed rule banning raw hex colours — apply it with your own `files`/`ignores`
 * (exempt generated token files). Use a `--tw-*` CSS variable or an @threadwick/core token instead.
 */
export const noRawHex = {
  rules: {
    'no-restricted-syntax': [
      'error',
      {
        selector: 'Literal[value=/#[0-9a-fA-F]{3,8}/]',
        message: 'Raw hex colour is banned — use a --tw-* CSS variable or an @threadwick/core token.',
      },
    ],
  },
};

export default base;

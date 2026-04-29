import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores([
    'dist',
    'server/dist',
    'server/node_modules',
    'node_modules',
    'evolution',
    'evolution-api-official',
    'supabase',
    '**/._*',
  ]),
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrors: 'none',
        },
      ],
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': 'off',
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@apps/*', '@hub/*', '@core/*'],
              message: 'Zaptro deve permanecer isolado; não importe código de outros produtos.',
            },
            {
              group: ['../logta/**', '../../logta/**', '../../../logta/**'],
              message: 'Zaptro deve permanecer isolado; não importe código de apps/logta.',
            },
            {
              group: ['../hub/**', '../../hub/**', '../../../hub/**'],
              message: 'Zaptro deve permanecer isolado; não importe código de hub.',
            },
          ],
        },
      ],
    },
  },
])

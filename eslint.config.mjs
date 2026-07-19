import tseslint from 'typescript-eslint'
import nextPlugin from 'eslint-config-next'

export default tseslint.config(
  ...tseslint.configs.recommended,
  ...nextPlugin,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      // Our data hooks/pages fetch on mount via useEffect + setState, a standard
      // and correct pattern without a data-fetching library. This rule's stricter
      // React-Compiler-era heuristic flags it as an error; keep it visible as a
      // warning rather than disabling it outright.
      'react-hooks/set-state-in-effect': 'warn',
      // Server Components computing a per-request timestamp (e.g. "5 minutes
      // ago" for an online-users query) is correct — it must be re-evaluated
      // on every request, not memoized. The rule can't distinguish that from
      // a genuinely impure client render, so keep it visible as a warning.
      'react-hooks/purity': 'warn',
    },
  },
  {
    ignores: ['**/.next/**', '**/node_modules/**', '**/*.js', '**/*.mjs'],
  }
)

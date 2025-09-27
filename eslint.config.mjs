import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: { sourceType: 'module', ecmaVersion: 2022 },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
    },
  },
  {
    plugins: { import: await import('eslint-plugin-import') },
    rules: {
      'import/order': [
        'warn',
        {
          'newlines-between': 'always',
          alphabetize: { order: 'asc' },
          groups: [['builtin', 'external'], 'internal', ['parent', 'sibling', 'index']],
        },
      ],
    },
  },
  {
    rules: {
      'arrow-body-style': 'off',
      'prefer-arrow-callback': 'off',
    },
  },
];

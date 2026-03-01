module.exports = {
  root: true,
  extends: ['eslint:recommended'],
  overrides: [
    {
      files: [
        '.eslintrc.js',
        '*.config.js',
        '**/*.config.js',
        'scripts/**/*.js',
      ],
      env: {
        node: true,
        es2022: true,
      },
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'script',
      },
    },
    {
      files: ['**/*.{ts,tsx}'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        tsconfigRootDir: __dirname,
        project: [
          './tsconfig.json',
          './packages/*/tsconfig.json',
          './packages/shared/tsconfig.eslint.json',
          './packages/electron-app/tsconfig.*.json',
        ],
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      plugins: ['@typescript-eslint'],
      extends: ['plugin:@typescript-eslint/recommended'],
      rules: {
        '@typescript-eslint/no-use-before-define': 'off',
        '@typescript-eslint/no-unused-vars': 'warn',
      },
    },
  ],
  ignorePatterns: [
    'electron/**/*',
    'dist/**/*',
    '.umi/**/*',
    '**/.next/**/*',
    '**/next-env.d.ts',
  ],
};

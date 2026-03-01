module.exports = {
  extends: [require.resolve('umi/eslint')],
  parserOptions: {
    project: [
      './tsconfig.json',
      './packages/*/tsconfig.json',
      './packages/shared/tsconfig.eslint.json',
      './packages/electron-app/tsconfig.*.json',
    ],
  },
  rules: {
    '@typescript-eslint/no-use-before-define': 'off',
    '@typescript-eslint/no-unused-vars': 'warn',
  },
  ignorePatterns: [
    'electron/**/*',
    'dist/**/*',
    '.umi/**/*',
    '**/.next/**/*',
    '**/next-env.d.ts',
  ],
};

const extendsConfig = [];

try {
  extendsConfig.push(require.resolve('umi/eslint'));
} catch {
  extendsConfig.push(
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  );
}

module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: extendsConfig,
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 'latest',
    project: [
      './tsconfig.json',
      './packages/*/tsconfig.json',
      './packages/shared/tsconfig.eslint.json',
      './packages/electron-app/tsconfig.*.json',
    ],
  },
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
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

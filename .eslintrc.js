module.exports = {
  extends: [require.resolve('umi/eslint')],
  parserOptions: {
    project: './tsconfig.json',
  },
  rules: {
    '@typescript-eslint/no-use-before-define': 'off',
    '@typescript-eslint/no-unused-vars': 'warn',
  },
};

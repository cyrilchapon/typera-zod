module.exports = {
  root: true,
  // ignorePatterns: ['.eslintrc.cjs', '.prettierrc.cjs'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  rules: {
    'prettier/prettier': ['error', require('./.eslintrc.cjs')],
  },
}

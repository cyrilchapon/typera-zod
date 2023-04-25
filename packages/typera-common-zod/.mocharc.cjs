module.exports = {
  require: 'ts-node/register',
  // loader: 'ts-node/esm',
  extensions: ['ts'],
  spec: ['tests/**/*.test.*'],
  'watch-files': ['src', 'tests'],
}

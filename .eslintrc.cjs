module.exports = {
  root: true,

  env: {
    node: true,
    browser: true
  },

  extends: [
    'eslint:recommended',
    'eslint-config-standard'
  ],

  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  }
}

module.exports = {
  env: {
    es6: true,
    node: true,
  },
  parserOptions: {
    "ecmaVersion": 2018,
  },
  extends: [
    "eslint:recommended",
    "google",
  ],
  rules: {
    "no-restricted-globals": ["error", "name", "length"],
    "prefer-arrow-callback": "error",
    "quotes": ["error", "double"],
    "max-len": ["error", {"code": 200}],
  },
  overrides: [
    {
      files: ["*.js"],
      excludedFiles: ["*.test.js"],
    },
  ],
  globals: {},
};

const { FlatCompat } = require("@eslint/eslintrc");
const js = require("@eslint/js");
const path = require("path");

const compat = new FlatCompat({
  baseDirectory: path.resolve(__dirname),
  recommendedConfig: js.configs.recommended,
});

module.exports = [
  {
    ignores: ["dist/*", "node_modules/*", "rootStore.example.ts", "nativewind-env.d.ts", "eslint.config.js"],
  },
  ...compat.extends("expo"),
  {
    rules: {
      "import/first": "off",
    },
  },
];

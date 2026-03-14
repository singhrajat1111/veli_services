const tseslint = require("@typescript-eslint/eslint-plugin");
const tsParser = require("@typescript-eslint/parser");
const unusedImports = require("eslint-plugin-unused-imports");
const importPlugin = require("eslint-plugin-import");
const boundaries = require("eslint-plugin-boundaries");

module.exports = [
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.eslint.json",
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      import: importPlugin,
      "unused-imports": unusedImports,
      boundaries: boundaries,
    },
    settings: {
      "boundaries/elements": [
        { type: "app", pattern: "src/app/**" },
        { type: "application", pattern: "src/application/**" },
        { type: "modules", pattern: "src/modules/**" },
        { type: "infrastructure", pattern: "src/infrastructure/**" },
        { type: "shared", pattern: "src/shared/**" },
      ],
    },
    rules: {
      // --- Type safety ---
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-floating-promises": "error",

      // --- Imports ---
      "unused-imports/no-unused-imports": "error",
      "import/order": [
        "error",
        {
          groups: [["builtin", "external"], ["internal"], ["parent", "sibling"]],
          pathGroups: [
            {
              pattern: "@/**",
              group: "internal",
            },
          ],
          pathGroupsExcludedImportTypes: ["builtin"],
          "newlines-between": "always",
        },
      ],

      // --- Architecture ---
      "boundaries/element-types": [
        "error",
        {
          default: "disallow",
          rules: [
            { from: "app", allow: ["application", "shared"] },
            { from: "application", allow: ["modules", "infrastructure", "shared"] },
            { from: "modules", allow: ["shared"] },
            { from: "infrastructure", allow: ["shared"] },
            { from: "shared", allow: [] },
          ],
        },
      ],

      // --- Hygiene ---
      "no-console": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
    },
  },
  {
    files: ["src/shared/logger.ts"],
    rules: {
      "no-console": "off",
    },
  },
];

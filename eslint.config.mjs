import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import eslintConfigPrettier from "eslint-config-prettier";
import pluginPerfectionist from "eslint-plugin-perfectionist"
import prettier from "eslint-plugin-prettier";

export default [
  {
    files: ["**/*.ts"],
  },
  {
    languageOptions: {
      ecmaVersion: 2022,
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: ".",
      },
      sourceType: "module",
    },

    plugins: {
      "@typescript-eslint": typescriptEslint,
      prettier: prettier,
    },
  },
  pluginPerfectionist.configs["recommended-natural"],
  eslintConfigPrettier,
  {
    rules: {
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/strict-boolean-expressions": "error",
    },
  },
];

import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      react.configs.flat.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      // Must be last: turns off ESLint rules that conflict with Prettier formatting.
      prettier,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    settings: {
      // Let eslint-plugin-react detect the installed React version.
      react: { version: "detect" },
    },
    rules: {
      // Prefer the TypeScript-aware version.
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["error"],

      // Not needed with the modern JSX transform.
      "react/react-in-jsx-scope": "off",
    },
  },
]);

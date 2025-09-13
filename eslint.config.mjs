/*
 * ESLint Flat Config（ESLint v9 以降）
 * - 既存の extends（eslint:recommended / typescript / next）を FlatCompat で取り込み
 * - チーム方針: 警告はCI失敗（--max-warnings=0）。初期はimport並び順を無効化。
 */
import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import path from "node:path";

const compat = new FlatCompat({
  baseDirectory: path.resolve("."),
  recommendedConfig: js.configs.recommended,
});

export default [
  // 無視パターン（旧 .eslintignore 相当）
  {
    ignores: [
      "node_modules/",
      ".next/",
      "out/",
      "build/",
      "dist/",
      ".cache/",
      "coverage/",
      "next-env.d.ts",
      "eslint.config.mjs",
      "_ui_sample/**",
    ],
  },

  // 旧 .eslintrc.js の内容を互換モードで読み込み
  ...compat.config({
    root: true,
    parser: "@typescript-eslint/parser",
    parserOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      ecmaFeatures: { jsx: true },
    },
    env: { browser: true, node: true, es2022: true },
    plugins: ["@typescript-eslint", "unused-imports", "simple-import-sort"],
    extends: [
      "plugin:@typescript-eslint/recommended",
      "next/core-web-vitals",
    ],
    rules: {
      // console は warn/error を許容
      "no-console": ["warn", { allow: ["warn", "error"] }],

      // 未使用インポート/変数はエラー
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "error",
        { args: "after-used", argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],

      // import 並び順（初期は無効化。必要に応じて 'error' へ）
      "simple-import-sort/imports": "off",
      "simple-import-sort/exports": "off",

      // 互換性重視（必要時に厳格化）
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "no-empty": "off",
    },
  }),
];

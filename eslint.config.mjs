import { defineConfig } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  {
    ignores: [
      ".next/**",
      ".next-*/**",
      "node_modules/**",
      "out/**",
      "build/**",
      "dist/**",
      "next-env.d.ts",
      ".agents/**",
      "docs/**",
      "scripts/**",
      "public/**",
      "src/app/(main)/_wallet/**",
      "**/_wallet/**",
    ],
  },
  ...nextVitals,
  ...nextTs,
]);

export default eslintConfig;

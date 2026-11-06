import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const dummyTsPlugin = {
  rules: new Proxy(
    {},
    {
      get: () => ({
        create: () => ({}),
      }),
    }
  ),
};

const eslintConfig = [
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
  {
    plugins: {
      "@typescript-eslint": dummyTsPlugin,
    },
  },
  ...compat.extends("next/core-web-vitals"),
];

export default eslintConfig;

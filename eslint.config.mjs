import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Web agéntica: copias sin cambios de la skill oficial (ver docs/web-agentica.md)
    ".claude/skills/**",
    "public/runtime/**",
    "public/bridge/**",
  ]),
]);

export default eslintConfig;

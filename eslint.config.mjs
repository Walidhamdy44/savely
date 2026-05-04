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
  ]),

  // Global code quality rules (warnings so the build doesn't break)
  {
    rules: {
      "max-lines": [
        "warn",
        { max: 200, skipBlankLines: true, skipComments: true },
      ],
      "max-lines-per-function": [
        "warn",
        { max: 20, skipBlankLines: true, skipComments: true },
      ],
      "import/no-default-export": "warn",
    },
  },

  // Stricter max-lines for component files
  {
    files: ["src/components/**/*.tsx"],
    rules: {
      "max-lines": [
        "warn",
        { max: 150, skipBlankLines: true, skipComments: true },
      ],
    },
  },

  // Allow default exports for Next.js page/layout/route files
  {
    files: [
      "src/app/**/page.tsx",
      "src/app/**/layout.tsx",
      "src/app/**/route.ts",
      "src/app/**/loading.tsx",
      "src/app/**/error.tsx",
      "src/app/**/not-found.tsx",
      "src/app/**/template.tsx",
      "src/app/**/default.tsx",
    ],
    rules: {
      "import/no-default-export": "off",
    },
  },

  // Allow default export in config files at project root
  {
    files: ["*.config.ts", "*.config.mjs", "*.config.js"],
    rules: {
      "import/no-default-export": "off",
    },
  },
]);

export default eslintConfig;

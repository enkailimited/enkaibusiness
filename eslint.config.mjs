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
  // Architecture enforcement: all creation must go through centralized engines
  {
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: 'CallExpression[callee.object.object.name="prisma"][callee.object.property.name="user"][callee.property.name="create"]',
          message: "Direct prisma.user.create() is forbidden. Use UserRegistrationEngine instead.",
        },
        {
          selector: 'CallExpression[callee.object.object.name="prisma"][callee.object.property.name="business"][callee.property.name="create"]',
          message: "Direct prisma.business.create() is forbidden. Use BusinessRegistrationEngine instead.",
        },
      ],
    },
  },
  // Allow engines, seed scripts, and auth self-registration
  {
    files: [
      "src/server/registrations/**/*.ts",
      "prisma/seed.ts",
      "scripts/**/*.ts",
      "src/features/auth/**/*.ts",
      "src/lib/auth.ts",
    ],
    rules: {
      "no-restricted-syntax": "off",
    },
  },
]);

export default eslintConfig;

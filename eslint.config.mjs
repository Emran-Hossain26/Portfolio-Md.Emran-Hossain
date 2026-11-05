import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Service-role access is centralised in src/lib/supabase/admin.ts which
  // carries `import "server-only"`. Client components must never import the
  // service client or the service-role env var. The `server-only` import is
  // the real build-time guard; this rule is the lint-time guard.
  {
    files: ["src/**/*.tsx", "src/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/lib/supabase/service"],
              message:
                "Service-role access is centralised in @/lib/supabase/admin (server-only). Import from there, or use @/lib/supabase/server for anon cookie-based access.",
            },
          ],
        },
      ],
    },
  },
  // Server actions and server-only modules may use the admin client.
  {
    files: ["src/app/(admin)/**/*.ts", "src/app/(admin)/**/*.tsx", "src/lib/supabase/**/*.ts", "src/lib/cms.ts"],
    rules: {
      "no-restricted-imports": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;

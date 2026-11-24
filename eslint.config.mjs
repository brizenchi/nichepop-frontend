import nextVitals from "eslint-config-next/core-web-vitals"
import nextTypescript from "eslint-config-next/typescript"

const config = [
  ...nextVitals,
  ...nextTypescript,
  {
    rules: {
      // Marketing and blog copy is full of apostrophes and quotes; React renders them fine.
      "react/no-unescaped-entities": "off",
      // Loading data in effects is how these pages and the template's account pages work; revisit with the React Compiler.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  {
    // The template's tests (tests/) load modules with require() on purpose.
    files: ["tests/**"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
  {
    // Template file (docs/template.md): fix it in go-modules, not here.
    files: ["lib/oauth-exchange.ts"],
    rules: { "prefer-const": "off" },
  },
  {
    // shadcn/ui as generated (the sidebar skeleton picks a random width).
    files: ["components/ui/**"],
    rules: { "react-hooks/purity": "off" },
  },
  {
    // The old /dashboard, removed with frontend#16.
    files: ["components/keyword-detail-dialog.tsx", "components/search-volume-chart.tsx", "lib/types/index.ts"],
    rules: { "@typescript-eslint/no-explicit-any": "off", "react-hooks/static-components": "off" },
  },
  { ignores: [".next/**", ".test-dist/**", "node_modules/**", "next-env.d.ts"] },
]

export default config

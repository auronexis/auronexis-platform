import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

/** Build Bible V2 Chapter 1 — foundation enforcement gates. */
const eslintConfig = [
  {
    ignores: ["next-env.d.ts", ".next/**", "node_modules/**", "artifacts/**"],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/ban-ts-comment": [
        "error",
        {
          "ts-ignore": true,
          "ts-nocheck": true,
          "ts-expect-error": "allow-with-description",
          minimumDescriptionLength: 12,
        },
      ],
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "stripe",
              message:
                "Mollie is the active billing provider. Do not reintroduce the Stripe SDK.",
            },
            {
              name: "@stripe/stripe-js",
              message:
                "Mollie is the active billing provider. Do not reintroduce Stripe client packages.",
            },
            {
              name: "@stripe/react-stripe-js",
              message:
                "Mollie is the active billing provider. Do not reintroduce Stripe React packages.",
            },
          ],
          patterns: [
            {
              group: ["@stripe/*"],
              message:
                "Mollie is the active billing provider. Do not reintroduce Stripe packages.",
            },
          ],
        },
      ],
    },
  },
];

export default eslintConfig;

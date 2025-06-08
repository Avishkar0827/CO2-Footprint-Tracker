import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    // Add custom rule overrides
    rules: {
      "react/no-unescaped-entities": "off", // Disables quote escaping errors
      "@typescript-eslint/no-explicit-any": "warn", // Downgrades 'any' to warning
      "@typescript-eslint/no-unused-vars": "warn", // Warns but doesn't fail build
    },
  },
];

export default eslintConfig;
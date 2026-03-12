import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: [".next/**", "out/**", "build/**", "dist/**", "next-env.d.ts"],
    rules: {
      "react-hooks/immutability": "error",
      "react/no-unescaped-entities": "error",
      "react-hooks/set-state-in-effect": "error",
    },
  },
];

export default eslintConfig;

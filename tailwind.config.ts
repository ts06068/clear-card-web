import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/server/**/*.{ts,tsx}",
    "./src/types/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        journal: {
          navy: "#081F3D",
          ink: "var(--color-ink)",
          slate: "var(--color-slate)",
          muted: "var(--color-muted)",
          line: "var(--color-line)",
          surface: "var(--color-surface)",
          crimson: "#A22A2F",
          crimsonDark: "#7E1F25",
          blue: "#1F5D8C",
          teal: "#397C7A",
          gold: "#A67C2D"
        }
      },
      boxShadow: {
        hairline: "0 1px 0 rgba(8, 31, 61, 0.06)"
      }
    }
  },
  plugins: []
};

export default config;

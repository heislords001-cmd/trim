import type { Config } from "tailwindcss";

// Clean black & white with one minimal accent — gold used sparingly
// (star ratings, small highlights), everything else strict grayscale.
// Colors are RGB triples in globals.css (e.g. "10 10 10") referenced as
// rgb(var(--x) / <alpha-value>) so Tailwind's opacity modifiers
// (bg-accent/15, etc.) actually work — a plain var(--x) string can't
// support the /NN syntax.
const config: Config = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: "rgb(var(--bg) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        surfaceMuted: "rgb(var(--surface-2) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        accentInk: "rgb(var(--accent-ink) / <alpha-value>)",
        gold: "rgb(var(--gold) / <alpha-value>)",
        textPrimary: "rgb(var(--text) / <alpha-value>)",
        textMuted: "rgb(var(--text-muted) / <alpha-value>)"
      },
      borderRadius: {
        card: "18px"
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"]
      }
    }
  },
  plugins: []
};
export default config;

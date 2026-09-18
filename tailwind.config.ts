import type { Config } from "tailwindcss";

// Oxblood / ink / brass — grounded in barber-pole red and brass fixtures
// instead of a generic SaaS purple. Both modes are CSS variables (see
// globals.css) so the same classes work in light and dark automatically.
const config: Config = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        surfaceMuted: "var(--surface-2)",
        border: "var(--border)",
        accent: "var(--accent)",
        accentInk: "var(--accent-ink)",
        gold: "var(--gold)",
        textPrimary: "var(--text)",
        textMuted: "var(--text-muted)"
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

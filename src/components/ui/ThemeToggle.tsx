"use client";

import { useEffect, useState } from "react";

// Floats over every page (mounted once in the root layout). Persists to
// localStorage and defaults to the OS preference on first visit.
export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const preferred = stored ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    apply(preferred as "light" | "dark");
  }, []);

  function apply(next: "light" | "dark") {
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    setTheme(next);
  }

  return (
    <button
      onClick={() => apply(theme === "dark" ? "light" : "dark")}
      aria-label="Toggle dark mode"
      className="fixed right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface shadow-lg"
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}

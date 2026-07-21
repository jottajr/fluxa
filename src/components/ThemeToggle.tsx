"use client";

import { useTheme } from "@/lib/theme-context";

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, toggleTheme } = useTheme();

  if (compact) {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label="Alternar tema"
        className="flex h-8 w-8 items-center justify-center rounded-md text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        {theme === "dark" ? "🌙" : "☀️"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="flex w-full items-center justify-between rounded-md border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
    >
      <span>{theme === "dark" ? "Modo escuro" : "Modo claro"}</span>
      <span>{theme === "dark" ? "🌙" : "☀️"}</span>
    </button>
  );
}

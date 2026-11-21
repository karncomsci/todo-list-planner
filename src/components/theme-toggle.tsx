"use client";

import { Moon, Sun } from "lucide-react";

/** Switches between light and dark and remembers the choice in the browser (D8). */
export function ThemeToggle() {
  function toggle() {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      // Storage is blocked: the theme still changes for this visit.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="สลับธีมสว่างและมืด"
      title="สลับธีมสว่างและมืด"
      className="inline-flex size-10 items-center justify-center rounded-xl text-muted hover:bg-primary-soft hover:text-primary"
    >
      <Moon className="size-5 dark:hidden" aria-hidden />
      <Sun className="hidden size-5 dark:block" aria-hidden />
    </button>
  );
}

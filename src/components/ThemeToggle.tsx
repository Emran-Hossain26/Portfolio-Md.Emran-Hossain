"use client";

import { useSyncExternalStore } from "react";

/**
 * Sets <html data-theme>, persists the choice and prevents flash-on-load
 * (inline pre-paint script lives in the root layout). Visual: same button
 * the mockup had; the label shows the theme you will GET (mockup behaviour).
 * English label kept in both locales, as in the mockup.
 */

type Theme = "dark" | "light";
const listeners = new Set<() => void>();

function setTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem("theme", theme);
  } catch {}
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function getServerSnapshot(): Theme {
  return "light";
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const label = theme === "dark" ? "Light" : "Dark";

  return (
    <button
      type="button"
      aria-label="Toggle dark mode"
      onClick={() => setTheme(getSnapshot() === "dark" ? "light" : "dark")}
    >
      {label}
    </button>
  );
}

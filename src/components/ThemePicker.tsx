"use client";

import { useSyncExternalStore } from "react";
import {
  readActiveTheme,
  subscribeTheme,
  subscribeVisitorThemes,
  readVisitorThemes,
  writeTheme,
} from "@/lib/theme-client";

/**
 * Visitor theme picker in the header (right of the language switch) — a
 * dropdown listing the admin-enabled presets by name, like the approved
 * mockup. Choice persists in localStorage + cookie and is applied before
 * paint by the inline script; active state comes from the shared theme
 * store so it stays in sync with the visitor preview panel.
 */

type Props = {
  presets: { key: string; label: string }[];
  defaultPreset: string;
  visitorSwitch: boolean;
};

export function ThemePicker({ presets, defaultPreset, visitorSwitch }: Props) {
  const enabledKeys = presets.map((p) => p.key);

  const current = useSyncExternalStore(
    subscribeTheme,
    () => readActiveTheme(defaultPreset, enabledKeys),
    () => defaultPreset,
  );

  // The preview panel can locally override the DB's visitor-switch setting.
  const allowed = useSyncExternalStore(
    subscribeVisitorThemes,
    () => visitorSwitch && readVisitorThemes(),
    () => true,
  );

  if (!allowed || presets.length === 0) return null;

  return (
    <span className="theme-select">
      <select
        value={current}
        onChange={(e) => writeTheme(e.target.value)}
        aria-label="Colour theme"
      >
        {presets.map((p) => (
          <option key={p.key} value={p.key}>
            {p.label}
          </option>
        ))}
      </select>
      <span className="chev" aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </span>
    </span>
  );
}

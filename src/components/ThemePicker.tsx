"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { readActiveTheme, subscribeTheme, writeTheme } from "@/lib/theme-client";

/**
 * Visitor theme picker in the header (right of the language switch). It
 * switches the whole site between the admin-enabled presets. Choice
 * persists in localStorage + cookie and is applied before paint by the
 * inline script; the active-preset state comes from the shared theme
 * store (src/lib/theme-client.ts) so it stays in sync with the visitor
 * preview panel.
 *
 * Reads its preset list, default and on/off switch from props (sourced
 * from the DB via the server layout) — no hardcoded preset names here.
 */


// Swatch colours keyed by preset key (matches the CSS token --accent).
const SWATCH_HEX: Record<string, string> = {
  light: "#2F6BFF",
  dark: "#5B8CFF",
  cyber: "#2CFF6B",
  aurora: "#9B7BFF",
  warm: "#FFB020",
  ocean: "#0E9AA7",
  sunset: "#FF7A59",
  forest: "#1F7A4A",
  contrast: "#FFFF00",
};

type Props = {
  presets: { key: string; label: string }[];
  defaultPreset: string;
  visitorSwitch: boolean;
  compact?: boolean;
};

export function ThemePicker({ presets, defaultPreset, visitorSwitch, compact = false }: Props) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const enabledKeys = presets.map((p) => p.key);

  const current = useSyncExternalStore(
    subscribeTheme,
    () => readActiveTheme(defaultPreset, enabledKeys),
    () => defaultPreset,
  );

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!visitorSwitch || presets.length === 0) return null;

  return (
    <div
      className={compact ? "theme-picker-inline" : "theme-dock"}
      ref={boxRef}
      style={compact ? { position: "relative", display: "inline-flex", alignItems: "center" } : undefined}
    >
      {open ? (
        <div className="theme-dock-panel" role="dialog" aria-label="Choose a theme" aria-modal="false">
          <p className="theme-dock-title">Theme</p>
          <div className="theme-dock-swatches" role="radiogroup" aria-label="Colour theme">
            {presets.map((p) => (
              <button
                key={p.key}
                type="button"
                role="radio"
                aria-checked={current === p.key}
                className={"theme-dock-swatch" + (current === p.key ? " active" : "")}
                style={{ background: SWATCH_HEX[p.key] ?? "#2F6BFF" }}
                title={p.label}
                aria-label={p.label}
                onClick={() => { writeTheme(p.key); setOpen(false); }}
              />
            ))}
          </div>
          <button
            type="button"
            className="theme-dock-row"
            onClick={() => writeTheme(current === "dark" ? "light" : "dark")}
          >
            {current === "dark" ? "Light mode" : "Dark mode"}
          </button>
        </div>
      ) : null}
      <button
        type="button"
        className="theme-dock-fab"
        aria-expanded={open}
        aria-label={open ? "Close theme picker" : "Open theme picker"}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 3a9 9 0 0 1 0 18Z" fill="currentColor" stroke="none" />
          </svg>
        )}
      </button>
    </div>
  );
}
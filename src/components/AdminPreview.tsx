"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { readActiveTheme, subscribeTheme, writeTheme } from "@/lib/theme-client";

/**
 * Floating "admin preview" panel (bottom-left): a live demo of the controls
 * the real admin panel will expose. Visitors can toggle the real home
 * sections (data-sec attributes), switch themes via the shared theme store,
 * flip effects and edit the hero headline — all persisted in localStorage
 * and applied live. Theme and language are intentionally NOT stored here:
 * theme lives in the shared store ("theme" key, same as the header picker)
 * and lang is owned by the URL locale.
 */

const STORAGE_KEY = "pf";

type State = {
  fx: { all: boolean; trail: boolean; tilt: boolean };
  secs: Record<string, boolean>;
  headline: string;
  available: boolean;
};

const DEFAULT_STATE: State = {
  fx: { all: true, trail: true, tilt: true },
  // Keys match the data-sec attributes on the real home sections.
  secs: { expertise: true, stats: true, projects: true, certifications: true, reviews: true, faq: true, blog: true, contact: true },
  headline: "",
  available: true,
};

// Same keys as the DB presets; used only for the swatch row's active state.
const PREVIEW_KEYS = ["light", "dark", "cyber", "aurora", "warm", "ocean", "sunset", "forest", "contrast"];

function readState(): State {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_STATE, ...parsed, fx: { ...DEFAULT_STATE.fx, ...parsed.fx }, secs: { ...DEFAULT_STATE.secs, ...parsed.secs } };
    }
  } catch {}
  return { ...DEFAULT_STATE };
}

function writeState(s: State) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
}

function applyState(s: State) {
  document.documentElement.dataset.effects = s.fx.all ? "on" : "off";
  for (const [k, v] of Object.entries(s.secs)) {
    const el = document.querySelector(`[data-sec="${k}"]`);
    if (el) (el as HTMLElement).hidden = !v;
  }
  const h1 = document.getElementById("h1");
  if (h1 && s.headline) h1.textContent = s.headline;
  const avail = document.getElementById("avail");
  if (avail) avail.classList.toggle("off", !s.available);
  try { localStorage.setItem("cursor_fx", s.fx.trail ? "on" : "off"); } catch {}
  window.dispatchEvent(new Event("cursorfx:change"));
}

export function AdminPreview() {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<State>(() =>
    typeof window !== "undefined" ? readState() : DEFAULT_STATE,
  );
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    applyState(state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const update = (patch: Partial<State>) => {
    const next = { ...state, ...patch };
    setState(next);
    writeState(next);
    applyState(next);
  };

  const toggleSec = (key: string) => {
    update({ secs: { ...state.secs, [key]: !state.secs[key] } });
  };

  const toggleFx = (key: "all" | "trail" | "tilt") => {
    update({ fx: { ...state.fx, [key]: !state.fx[key] } });
  };

  // Active theme comes from the shared store (same source as the header
  // picker), so the two controls always agree.
  const activeTheme = useSyncExternalStore(
    subscribeTheme,
    () => readActiveTheme("light", PREVIEW_KEYS),
    () => "light",
  );

  return (
    <div className="admin-preview-dock" ref={boxRef}>
      {open ? (
        <div className="admin-preview-panel" role="dialog" aria-label="Admin preview controls" aria-modal="false">
          <div className="admin-preview-header">
            <h3>Admin preview</h3>
            <button type="button" className="admin-preview-close" aria-label="Close" onClick={() => setOpen(false)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <p className="admin-preview-note">Preview of what you will control from the real admin panel.</p>

          <div className="admin-preview-section">
            <h4>Theme</h4>
            <div className="admin-preview-swatches">
              {PREVIEW_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  className={"admin-preview-swatch" + (activeTheme === key ? " active" : "")}
                  style={{ background: SWATCH_HEX[key] ?? "#2F6BFF" }}
                  title={key}
                  aria-label={`Theme: ${key}`}
                  aria-pressed={activeTheme === key}
                  onClick={() => writeTheme(key)}
                />
              ))}
            </div>
          </div>

          <div className="admin-preview-section">
            <h4>Sections</h4>
            {[
              { key: "expertise", label: "Expertise" },
              { key: "stats", label: "Stats" },
              { key: "projects", label: "Projects" },
              { key: "certifications", label: "Certifications" },
              { key: "reviews", label: "Reviews" },
              { key: "faq", label: "FAQ" },
              { key: "blog", label: "Blog" },
              { key: "contact", label: "Contact" },
            ].map((s) => (
              <label key={s.key} className="admin-preview-toggle">
                <input
                  type="checkbox"
                  checked={state.secs[s.key] ?? true}
                  onChange={() => toggleSec(s.key)}
                />
                <span>{s.label}</span>
              </label>
            ))}
          </div>

          <div className="admin-preview-section">
            <h4>Effects</h4>
            <label className="admin-preview-toggle">
              <input
                type="checkbox"
                checked={state.fx.all}
                onChange={() => toggleFx("all")}
              />
              <span>Page effects (all)</span>
            </label>
            <label className="admin-preview-toggle">
              <input
                type="checkbox"
                checked={state.fx.trail}
                disabled={!state.fx.all}
                onChange={() => toggleFx("trail")}
              />
              <span>Cursor sparkle trail</span>
            </label>
            <label className="admin-preview-toggle">
              <input
                type="checkbox"
                checked={state.fx.tilt}
                disabled={!state.fx.all}
                onChange={() => toggleFx("tilt")}
              />
              <span>3D tilt cards</span>
            </label>
          </div>

          <div className="admin-preview-section">
            <h4>Hero headline</h4>
            <input
              type="text"
              className="admin-preview-input"
              placeholder="Type a new headline"
              value={state.headline}
              onChange={(e) => update({ headline: e.target.value })}
            />
          </div>

          <div className="admin-preview-section">
            <h4>Availability</h4>
            <label className="admin-preview-toggle">
              <input
                type="checkbox"
                checked={state.available}
                onChange={() => update({ available: !state.available })}
              />
              <span>Show &quot;Available for projects&quot;</span>
            </label>
          </div>
        </div>
      ) : null}
      <button
        type="button"
        className="admin-preview-fab"
        aria-expanded={open}
        aria-label="Open admin preview"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        )}
      </button>
    </div>
  );
}

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
"use client";

import { useEffect, useRef, useState } from "react";
import { writeTheme } from "@/lib/theme-client";

/**
 * Visitor "Admin controls" drawer (approved mockup): slides in from the
 * right; every control applies live to the real page and persists in
 * localStorage.
 *
 * - Sections toggle the real home sections (data-sec attributes).
 * - Status toggles the availability chip (#avail).
 * - Hero headline edits the real h1 (#h1) on the homepage.
 * - Effects write both the master html[data-effects] switch and the
 *   per-effect flags consumed by the canvas/tilt components (pf:fx).
 * - "Visitor themes allowed" locally demos the DB visitor-switch setting;
 *   the header dropdown reacts via pf:visitor.
 *
 * Theme swatches are NOT stored here: theme lives in the shared store
 * (src/lib/theme-client.ts) and the header dropdown is the control for it.
 */

const STORAGE_KEY = "pf";

type State = {
  fx: { all: boolean; network: boolean; trail: boolean; tilt: boolean };
  secs: Record<string, boolean>;
  headline: string;
  available: boolean;
  visitorThemes: boolean;
};

const DEFAULT_STATE: State = {
  fx: { all: true, network: true, trail: true, tilt: true },
  // Keys match the data-sec attributes on the real home sections.
  secs: { expertise: true, certifications: true, projects: true, stats: true, reviews: true, faq: true, blog: true, contact: true },
  headline: "",
  available: true,
  visitorThemes: true,
};

const SECTION_ROWS: { key: keyof State["secs"]; label: string }[] = [
  { key: "expertise", label: "What I do" },
  { key: "certifications", label: "Case study" },
  { key: "projects", label: "Projects" },
  { key: "stats", label: "Numbers" },
  { key: "reviews", label: "Reviews" },
  { key: "faq", label: "FAQ" },
  { key: "blog", label: "Blog" },
  { key: "contact", label: "Contact" },
];

function readState(): State {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<State>;
      return {
        ...DEFAULT_STATE,
        ...parsed,
        fx: { ...DEFAULT_STATE.fx, ...parsed.fx },
        secs: { ...DEFAULT_STATE.secs, ...parsed.secs },
      };
    }
  } catch {}
  return { ...DEFAULT_STATE };
}

function writeState(s: State) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
}

/** Applies everything that is not a React concern to the live document. */
function applyState(s: State) {
  document.documentElement.dataset.effects = s.fx.all ? "on" : "off";
  try {
    localStorage.setItem("network_bg", s.fx.network ? "on" : "off");
    localStorage.setItem("cursor_fx", s.fx.trail ? "on" : "off");
    localStorage.setItem("tilt_cards", s.fx.tilt ? "on" : "off");
  } catch {}
  for (const [k, v] of Object.entries(s.secs)) {
    const el = document.querySelector(`[data-sec="${k}"]`);
    if (el) (el as HTMLElement).hidden = !v;
  }
  const h1 = document.getElementById("h1");
  if (h1 && s.headline) h1.textContent = s.headline;
  const avail = document.getElementById("avail");
  if (avail) avail.classList.toggle("off", !s.available);
  // Sync the canvas effects and the header theme dropdown.
  window.dispatchEvent(new Event("pf:fx"));
  window.dispatchEvent(new Event("pf:visitor"));
}

export function AdminPreview() {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<State>(() =>
    typeof window !== "undefined" ? readState() : DEFAULT_STATE,
  );
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    applyState(state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
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

  const toggleFx = (key: "all" | "network" | "trail" | "tilt") => {
    update({ fx: { ...state.fx, [key]: !state.fx[key] } });
  };

  return (
    <>
      <button
        type="button"
        className="admin-preview-fab"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
        Admin preview
      </button>

      {open ? (
        <>
          <div className="admin-preview-backdrop" onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            className="admin-preview-panel"
            role="dialog"
            aria-label="Admin controls preview"
            aria-modal="false"
          >
            <div className="admin-preview-header">
              <h3>Admin controls</h3>
              <button
                type="button"
                className="admin-preview-close"
                aria-label="Close"
                ref={closeRef}
                onClick={() => setOpen(false)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <p className="admin-preview-note">
              Preview of what you will control from the real admin. Changes
              apply live here.
            </p>

            <div className="admin-preview-section">
              <p className="admin-preview-label">
                <b>Hero headline</b> (bn/en editable)
              </p>
              <input
                type="text"
                className="admin-preview-input"
                placeholder="Type a new headline"
                value={state.headline}
                onChange={(e) => update({ headline: e.target.value })}
              />
            </div>

            <div className="admin-preview-section">
              <h4>Status</h4>
              <label className="admin-preview-toggle">
                <span>Show &quot;Available for projects&quot;</span>
                <input
                  type="checkbox"
                  checked={state.available}
                  onChange={() => update({ available: !state.available })}
                />
                <span className="track" aria-hidden="true" />
              </label>
            </div>

            <div className="admin-preview-section">
              <h4>Sections</h4>
              {SECTION_ROWS.map((s) => (
                <label key={s.key} className="admin-preview-toggle">
                  <span>{s.label}</span>
                  <input
                    type="checkbox"
                    checked={state.secs[s.key] ?? true}
                    onChange={() => toggleSec(s.key)}
                  />
                  <span className="track" aria-hidden="true" />
                </label>
              ))}
            </div>

            <div className="admin-preview-section">
              <h4>Effects</h4>
              <label className="admin-preview-toggle">
                <span>Page effects (all)</span>
                <input
                  type="checkbox"
                  checked={state.fx.all}
                  onChange={() => toggleFx("all")}
                />
                <span className="track" aria-hidden="true" />
              </label>
              <label className="admin-preview-toggle">
                <span>Network background</span>
                <input
                  type="checkbox"
                  checked={state.fx.network}
                  disabled={!state.fx.all}
                  onChange={() => toggleFx("network")}
                />
                <span className="track" aria-hidden="true" />
              </label>
              <label className="admin-preview-toggle">
                <span>Cursor sparkle trail</span>
                <input
                  type="checkbox"
                  checked={state.fx.trail}
                  disabled={!state.fx.all}
                  onChange={() => toggleFx("trail")}
                />
                <span className="track" aria-hidden="true" />
              </label>
              <label className="admin-preview-toggle">
                <span>3D tilt cards</span>
                <input
                  type="checkbox"
                  checked={state.fx.tilt}
                  disabled={!state.fx.all}
                  onChange={() => toggleFx("tilt")}
                />
                <span className="track" aria-hidden="true" />
              </label>
            </div>

            <div className="admin-preview-section">
              <h4>Visitor themes</h4>
              <label className="admin-preview-toggle">
                <span>Visitor themes allowed</span>
                <input
                  type="checkbox"
                  checked={state.visitorThemes}
                  onChange={() => update({ visitorThemes: !state.visitorThemes })}
                />
                <span className="track" aria-hidden="true" />
              </label>
              <p className="admin-preview-note" style={{ marginTop: 6 }}>
                Hides the theme dropdown in the header. In the real admin this
                comes from the database.{" "}
                <button
                  type="button"
                  className="admin-preview-link"
                  onClick={() => writeTheme("light")}
                >
                  Reset to Light
                </button>
              </p>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}

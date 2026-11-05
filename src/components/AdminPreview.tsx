"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { writeTheme } from "@/lib/theme-client";
import { applyGroupFlags, computeGroups, subscribeGroups, writeGroup, type GroupKey } from "@/lib/fx/groups";

/**
 * "Admin preview" (owner-approved mockup): a dark pill bottom-left opening
 * a right-side drawer with a live demo of the controls the real admin will
 * expose — hero headline, availability status, home sections and the
 * visitor-themes switch. Per-effect animation toggles live in the separate
 * "✨ Effects" button (bottom-right); theme switching lives in the header.
 * Everything applies live and persists in localStorage.
 */

const STORAGE_KEY = "pf";

type State = {
  secs: Record<string, boolean>;
  headline: string;
  available: boolean;
  visitorThemes: boolean;
  themes: Record<string, boolean>;
};

const THEME_KEYS = ["light", "dark", "cyber", "aurora", "warm", "ocean", "sunset", "forest", "contrast"];const THEME_LABELS: Record<string, string> = {
  light: "Light", dark: "Dark", cyber: "Cyber", aurora: "Aurora", warm: "Warm Paper",
  ocean: "Ocean", sunset: "Sunset", forest: "Forest", contrast: "High Contrast",
};
const DEFAULT_STATE: State = {
  // Keys match the data-sec attributes on the real home sections.
  secs: { expertise: true, certifications: true, projects: true, stats: true, reviews: true, faq: true, blog: true, contact: true },
  headline: "",
  available: true,
  visitorThemes: true,
  themes: {},
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
      return { ...DEFAULT_STATE, ...parsed, secs: { ...DEFAULT_STATE.secs, ...parsed.secs }, themes: { ...DEFAULT_STATE.themes, ...parsed.themes } };
    }
  } catch {}
  return { ...DEFAULT_STATE };
}

function writeState(s: State) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
}

function applyState(s: State) {
  for (const [k, v] of Object.entries(s.secs)) {
    const el = document.querySelector(`[data-sec="${k}"]`);
    if (el) (el as HTMLElement).hidden = !v;
  }
  const h1 = document.getElementById("h1");
  if (h1 && s.headline) h1.textContent = s.headline;
  const avail = document.getElementById("avail");
  if (avail) avail.classList.toggle("off", !s.available);
  // Hide/show theme options in the header dropdown directly (React never
  // re-renders the option list, so imperative attrs persist).
  const sel = document.querySelector<HTMLSelectElement>(".theme-select select");
  if (sel) {
    for (const o of Array.from(sel.options)) {
      const hide = s.themes[o.value] === false;
      o.disabled = hide;
      o.hidden = hide;
    }
    if (sel.selectedOptions[0]?.hidden) {
      const first = Array.from(sel.options).find((o) => !o.hidden);
      if (first) writeTheme(first.value);
    }
  }
  window.dispatchEvent(new Event("pf:visitor"));
}

let cachedGroups: { animation: boolean; cursor: boolean; magical: boolean; reduced: boolean; touch: boolean } | null = null;

export function AdminPreview({ allowed }: { allowed: Record<GroupKey, boolean> }) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<State>(() =>
    typeof window !== "undefined" ? readState() : DEFAULT_STATE,
  );
  const closeRef = useRef<HTMLButtonElement>(null);

  // Mirrors the ✨ Effects button via the shared groups store.
  const groups = useSyncExternalStore(
    subscribeGroups,
    () => {
      const next = computeGroups(allowed);
      if (!cachedGroups || next.animation !== cachedGroups.animation || next.cursor !== cachedGroups.cursor || next.magical !== cachedGroups.magical) cachedGroups = next;
      return cachedGroups;
    },
    () => ({ animation: false, cursor: false, magical: false, reduced: false, touch: false }),
  );

  useEffect(() => {
    applyState(state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
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

  const themeEnabled = (k: string) => state.themes[k] ?? true;
  const enabledCount = THEME_KEYS.filter(themeEnabled).length;
  const toggleTheme = (k: string) => {
    const nextThemes = { ...state.themes, [k]: !themeEnabled(k) };
    update({ themes: nextThemes });
    // Never leave the active theme disabled: fall back to the first enabled.
    if (!nextThemes[k]) {
      const active = document.documentElement.getAttribute("data-theme");
      if (active === k) {
        const first = THEME_KEYS.find((x) => nextThemes[x] ?? true);
        if (first) writeTheme(first);
      }
    }
  };
  const toggleGroup = (g: GroupKey) => {
    const next = { ...groups, [g]: !groups[g] };
    applyGroupFlags(next);
    writeGroup(g, next[g]);
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
          <div className="admin-preview-panel" role="dialog" aria-label="Admin controls preview" aria-modal="false">
            <div className="admin-preview-header">
              <h3>Admin controls</h3>
              <button type="button" className="admin-preview-close" aria-label="Close" ref={closeRef} onClick={() => setOpen(false)}>
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
              {([
                { g: "magical" as GroupKey, label: "Network background" },
                { g: "cursor" as GroupKey, label: "Cursor sparkle trail" },
                { g: "animation" as GroupKey, label: "3D tilt cards" },
              ]).map((row) =>
                allowed[row.g] ? (
                  <label key={row.g} className="admin-preview-toggle">
                    <span>{row.label}</span>
                    <input
                      type="checkbox"
                      checked={groups[row.g]}
                      onChange={() => toggleGroup(row.g)}
                    />
                    <span className="track" aria-hidden="true" />
                  </label>
                ) : null,
              )}
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
                <button type="button" className="admin-preview-link" onClick={() => writeTheme("light")}>
                  Reset to Light
                </button>
              </p>
              <div className="admin-preview-toggle" style={{ height: 8 }} aria-hidden="true" />
              <h4>Allowed themes</h4>
              {THEME_KEYS.map((k) => (
                <label key={k} className="admin-preview-toggle">
                  <span>{THEME_LABELS[k]}</span>
                  <input
                    type="checkbox"
                    checked={themeEnabled(k)}
                    disabled={themeEnabled(k) && enabledCount === 1}
                    onChange={() => toggleTheme(k)}
                  />
                  <span className="track" aria-hidden="true" />
                </label>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}

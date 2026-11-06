"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export type CustomizerSection = { key: string; label: string };
export type CustomizerTheme = { key: string; label: string };

/**
 * Stage 6/7 — visitor-facing customizer ("another admin preview, for
 * visitors"): visitors can hide/show home sections and try any theme from
 * their own browser. SESSION-ONLY by design — nothing is written to
 * localStorage/cookies/DB, so a reload (or the Reset button) returns
 * everything to the site defaults.
 */
export function VisitorCustomizer({
  sections,
  themes,
}: {
  sections: CustomizerSection[];
  themes: CustomizerTheme[];
}) {
  const t = useTranslations("visitorPreview");
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [theme, setTheme] = useState<string>("");

  const applySection = (key: string, show: boolean) => {
    document.querySelectorAll<HTMLElement>(`[data-sec="${key}"]`).forEach((el) => {
      el.style.display = show ? "" : "none";
    });
  };

  const toggleSection = (key: string) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
        applySection(key, true);
      } else {
        next.add(key);
        applySection(key, false);
      }
      return next;
    });
  };

  const pickTheme = (key: string) => {
    setTheme(key);
    // Session-only: set the token attribute directly — no cookie/localStorage.
    const root = document.documentElement;
    root.setAttribute("data-theme", key);
  };

  const reset = () => {
    for (const key of hidden) applySection(key, true);
    setHidden(new Set());
    setTheme("");
    // Reload is the cleanest "back to defaults" (the no-flash script
    // restores the visitor's saved/default theme).
    window.location.reload();
  };

  return (
    <>
      <button
        type="button"
        className="admin-preview-fab"
        style={{ background: "var(--panel)", color: "var(--ink)", border: "1px solid var(--line)" }}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((v) => !v)}
      >
        🎨 {t("button")}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="false"
          aria-label={t("title")}
          className="admin-preview-panel"
          style={{ position: "fixed", left: 14, bottom: 64, zIndex: 80, maxWidth: 300 }}
        >
          <div className="admin-preview-section">
            <b>{t("sections")}</b>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
              {sections.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  className={"chip" + (hidden.has(s.key) ? "" : " on")}
                  aria-pressed={!hidden.has(s.key)}
                  onClick={() => toggleSection(s.key)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <div className="admin-preview-section">
            <b>{t("theme")}</b>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
              {themes.map((th) => (
                <button
                  key={th.key}
                  type="button"
                  className={"chip" + (theme === th.key ? " on" : "")}
                  aria-pressed={theme === th.key}
                  onClick={() => pickTheme(th.key)}
                >
                  {th.label}
                </button>
              ))}
            </div>
          </div>
          <div className="admin-preview-section" style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button type="button" className="btn" onClick={reset}>{t("reset")}</button>
            <small className="mute" style={{ fontSize: 12 }}>{t("sessionNote")}</small>
          </div>
          <button
            type="button"
            className="btn"
            style={{ marginTop: 8 }}
            onClick={() => setOpen(false)}
          >
            {t("close")}
          </button>
        </div>
      ) : null}
    </>
  );
}

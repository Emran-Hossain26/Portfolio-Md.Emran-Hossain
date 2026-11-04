"use client";

import { useMemo, useState } from "react";
import { contrastChecks } from "@/lib/contrast";
import { DEFAULT_LIGHT, DEFAULT_DARK } from "@/lib/theme-defaults";
import type { ThemeTokens } from "@/lib/cms";

const TOKEN_KEYS: (keyof ThemeTokens)[] = ["accent", "bg", "panel", "ink", "mute", "line"];
const LABELS: Record<keyof ThemeTokens, string> = {
  accent: "Accent (buttons, links)",
  bg: "Page background",
  panel: "Card panel",
  ink: "Body text",
  mute: "Muted text",
  line: "Borders",
};

type Mode = "light" | "dark";

function hex6(v: string) {
  const n = v.trim();
  return /^#[0-9a-fA-F]{6}$/.test(n) ? n : null;
}

function ModeEditor({
  mode,
  tokens,
  onChange,
}: {
  mode: Mode;
  tokens: ThemeTokens;
  onChange: (key: keyof ThemeTokens, value: string) => void;
}) {
  const checks = useMemo(() => contrastChecks(tokens), [tokens]);
  return (
    <div className="card" style={{ marginTop: 14, maxWidth: 640 }}>
      <h3 style={{ marginBottom: 10 }}>{mode === "light" ? "Light theme" : "Dark theme"}</h3>
      {TOKEN_KEYS.map((key) => (
        <label key={key}>
          {LABELS[key]}
          <div className="admin-row" style={{ gridTemplateColumns: "1fr 120px" }}>
            <input
              type="text"
              value={tokens[key]}
              onChange={(e) => onChange(key, e.target.value)}
              spellCheck={false}
            />
            <div
              className="admin-swatch"
              style={{ background: hex6(tokens[key]) ?? "#8888" }}
              aria-hidden="true"
            />
          </div>
        </label>
      ))}
      <h4 style={{ margin: "14px 0 6px" }}>WCAG AA contrast ({mode})</h4>
      <table style={{ fontSize: 13, borderCollapse: "collapse" }}>
        <tbody>
          {checks.map((check) => (
            <tr key={check.pair}>
              <td style={{ padding: "3px 12px 3px 0" }}>{check.pair}</td>
              <td style={{ padding: "3px 12px 3px 0" }}>{check.ratio}:1</td>
              <td className={`admin-check ${check.pass ? "pass" : "fail"}`}>
                {check.pass ? "AA pass" : `AA fail (needs ${check.threshold}:1)`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Mini preview with the current tokens */}
      <div
        style={{
          marginTop: 14,
          background: tokens.bg,
          border: `1px solid ${tokens.line}`,
          borderRadius: 12,
          padding: 14,
          color: tokens.ink,
        }}
      >
        <b style={{ fontFamily: "var(--font-sora)" }}>Preview heading</b>
        <p style={{ color: tokens.mute, margin: "6px 0 10px", fontSize: 14 }}>
          Muted body text description.
        </p>
        <span
          style={{
            display: "inline-block",
            background: tokens.accent,
            color: "#fff",
            borderRadius: 8,
            padding: "7px 14px",
            fontSize: 14,
          }}
        >
          Primary button
        </span>
        <span
          style={{
            display: "inline-block",
            marginLeft: 8,
            background: tokens.panel,
            border: `1px solid ${tokens.line}`,
            color: tokens.ink,
            borderRadius: 8,
            padding: "7px 14px",
            fontSize: 14,
          }}
        >
          Panel
        </span>
      </div>
    </div>
  );
}

export function ThemeEditor({
  initialLight,
  initialDark,
  saveTheme,
}: {
  initialLight: ThemeTokens;
  initialDark: ThemeTokens;
  saveTheme: (lightJson: string, darkJson: string) => Promise<void>;
}) {
  const [light, setLight] = useState(initialLight);
  const [dark, setDark] = useState(initialDark);
  const [allow, setAllow] = useState(false);

  const lightFail = contrastChecks(light).some((c) => !c.pass);
  const darkFail = contrastChecks(dark).some((c) => !c.pass);

  async function handleSave() {
    // Only tokens differing from defaults are stored; rest falls back.
    const diff = (current: ThemeTokens, def: ThemeTokens) =>
      Object.fromEntries(
        TOKEN_KEYS.filter((key) => hex6(current[key]) && current[key].toLowerCase() !== def[key].toLowerCase())
          .map((key) => [key, current[key]]),
      );
    await saveTheme(JSON.stringify(diff(light, DEFAULT_LIGHT)), JSON.stringify(diff(dark, DEFAULT_DARK)));
  }

  const setFor = (mode: Mode) => (key: keyof ThemeTokens, value: string) =>
    mode === "light" ? setLight({ ...light, [key]: value }) : setDark({ ...dark, [key]: value });

  return (
    <div>
      <ModeEditor mode="light" tokens={light} onChange={setFor("light")} />
      <ModeEditor mode="dark" tokens={dark} onChange={setFor("dark")} />
      {lightFail || darkFail ? (
        <label className="admin-check fail" style={{ display: "block", margin: "14px 0" }}>
          <input
            type="checkbox"
            checked={allow}
            onChange={(e) => setAllow(e.target.checked)}
            style={{ marginRight: 8 }}
          />
          Some checks fail AA. I understand and want to save anyway.
        </label>
      ) : null}
      <div className="admin-actions">
        <button type="button" className="btn p" onClick={handleSave} disabled={!allow && (lightFail || darkFail)}>
          Save theme colours
        </button>
        <button
          type="button"
          className="btn admin-danger"
          onClick={() => {
            setLight(DEFAULT_LIGHT);
            setDark(DEFAULT_DARK);
          }}
        >
          Reset to mockup defaults
        </button>
      </div>
      <p className="admin-note" style={{ marginTop: 10 }}>
        Saved overrides apply site-wide (both themes are injected after the
        default stylesheet so admin colours always win). Tokens left equal to
        the defaults are not stored.
      </p>
    </div>
  );
}

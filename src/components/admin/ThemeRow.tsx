"use client";

import { contrastChecks } from "@/lib/contrast";
import { setThemePresetAction } from "@/app/(admin)/actions";

export type ThemeRowData = {
  key: string;
  name: string;
  enabled: boolean;
  isDefault: boolean;
  tokens: Record<string, string>;
};

/**
 * Mockup slide "Visitor themes" — one theme row: swatches, contrast details,
 * default radio, enable toggle. Client component so the toggles can submit
 * the bound server actions on change.
 */
export function ThemeRow({ preset }: { preset: ThemeRowData }) {
  const checks = contrastChecks(preset.tokens as { ink: string; mute: string; accent: string; bg: string; panel: string });
  const allPass = checks.every((c) => c.pass);

  return (
    <div className="row" style={{ flexWrap: "wrap" }}>
      <span
        className="sp"
        aria-hidden="true"
        style={{ display: "inline-flex", borderRadius: 6, overflow: "hidden", border: "1px solid var(--line)" }}
      >
        {(["bg", "panel", "ink", "accent"] as const).map((k) => (
          <i
            key={k}
            style={{
              width: 18, height: 18, display: "inline-block",
              background: preset.tokens[k],
            }}
          />
        ))}
      </span>
      <div className="gr">
        {preset.name}
        <small>ink/bg contrast {checks[0]?.ratio}:1</small>
      </div>
      <details style={{ fontSize: 12.5, color: "var(--mut2)" }}>
        <summary style={{ cursor: "pointer" }}>
          <span className={"chip " + (allPass ? "ok" : "warn")}>
            {allPass ? "AA pass" : `AA ${checks.filter((c) => c.pass).length}/${checks.length}`}
          </span>
        </summary>
        <ul style={{ margin: "6px 0 0", paddingLeft: 16 }}>
          {checks.map((c, i) => (
            <li key={i} style={{ color: c.pass ? "var(--ok)" : "#C0392B" }}>
              {c.pair}: {c.ratio}:1 (need {c.threshold})
            </li>
          ))}
        </ul>
      </details>
      <label style={{ fontSize: 13, color: "var(--mut2)", display: "flex", gap: 5, alignItems: "center" }}>
        <input
          type="radio"
          name="theme-default"
          defaultChecked={preset.isDefault}
          disabled={!preset.enabled}
          onChange={setThemePresetAction.bind(null, preset.key, "default")}
        />
        Default
      </label>
      <form action={setThemePresetAction.bind(null, preset.key, "enabled")}>
        <label style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, color: "var(--mut2)" }}>
          <input
            type="checkbox"
            name="enabled"
            defaultChecked={preset.enabled}
            onChange={(e) => e.currentTarget.form?.requestSubmit()}
          />
          {preset.enabled ? "on" : "off"}
        </label>
      </form>
    </div>
  );
}

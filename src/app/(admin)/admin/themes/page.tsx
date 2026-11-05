import { AdminShell } from "@/components/admin/AdminShell";
import { getThemePresets } from "@/lib/cms";
import { contrastChecks } from "@/lib/contrast";
import { DEFAULT_LIGHT, DEFAULT_DARK } from "@/lib/theme-defaults";

export default async function ThemesPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { saved } = await searchParams;
  const presets = await getThemePresets();

  // Seed presets if DB is empty / not configured.
  const seedPresets = [
    { id: "light", name: "Light", tokens: DEFAULT_LIGHT, enabled: true },
    { id: "dark", name: "Dark", tokens: DEFAULT_DARK, enabled: true },
    { id: "cyber", name: "Cyber", tokens: { accent: "#2CFF6B", bg: "#050805", panel: "#0B120B", ink: "#CFFFD6", mute: "#6FA77A", line: "#16301A" }, enabled: true },
    { id: "aurora", name: "Aurora", tokens: { accent: "#9B7BFF", bg: "#120E2B", panel: "#1B1640", ink: "#F1ECFF", mute: "#B3A9DE", line: "#34296B" }, enabled: true },
    { id: "warm", name: "Warm Paper", tokens: { accent: "#EE7D30", bg: "#F3EFE6", panel: "#FBF7EE", ink: "#2D4147", mute: "#6F8A90", line: "#D4C9B0" }, enabled: true },
    { id: "ocean", name: "Ocean", tokens: { accent: "#0E9AA7", bg: "#0A1929", panel: "#0F2744", ink: "#E0F0FF", mute: "#7BA8D4", line: "#1E3A5F" }, enabled: true },
    { id: "sunset", name: "Sunset", tokens: { accent: "#FF7A59", bg: "#1C0F1F", panel: "#2A1630", ink: "#FFEBDD", mute: "#D0A9B8", line: "#4A2A55" }, enabled: true },
    { id: "forest", name: "Forest", tokens: { accent: "#1F7A4A", bg: "#EEF3EC", panel: "#FFFFFF", ink: "#14261B", mute: "#4F6657", line: "#D3E0D3" }, enabled: true },
    { id: "contrast", name: "High Contrast", tokens: { accent: "#FFFF00", bg: "#000000", panel: "#000000", ink: "#FFFFFF", mute: "#CCCCCC", line: "#FFFFFF" }, enabled: true },
  ];

  const list = presets.length ? presets : seedPresets;

  return (
    <AdminShell current="/admin/themes" heading="Theme manager (visitor presets)">
      {saved ? <p className="admin-check pass">Saved.</p> : null}
      <p className="admin-note">
        Visitor-selectable themes. Each preset redefines the full token set
        (accent, bg, panel, ink, mute, line). Enable/disable each, set the
        default, and verify AA contrast. Stored in the <code>theme_presets</code>
        table. Toggle whether visitors can switch themes at all via the
        feature flag below.
      </p>

      <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
        {list.map((p) => {
          const checks = contrastChecks(p.tokens as { ink: string; mute: string; accent: string; bg: string; panel: string });
          const allPass = checks.every((c) => c.pass);
          return (
            <div className="card" key={p.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <h3 style={{ margin: 0 }}>{p.name}</h3>
                <span className={"admin-check " + (allPass ? "pass" : "fail")}>
                  {allPass ? "AA pass" : "AA fail"}
                </span>
              </div>
              <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                {(["accent", "bg", "panel", "ink", "mute", "line"] as const).map((key) => (
                  <span
                    key={key}
                    title={key}
                    style={{
                      width: 22, height: 22, borderRadius: 6,
                      background: (p.tokens as Record<string, string>)[key],
                      border: "1px solid var(--line)",
                      display: "inline-block",
                    }}
                  />
                ))}
              </div>
              <details>
                <summary style={{ cursor: "pointer", fontSize: 13, color: "var(--mute)" }}>
                  Contrast checks
                </summary>
                <ul style={{ fontSize: 12, marginTop: 6, listStyle: "none", padding: 0 }}>
                  {checks.map((c, i) => (
                    <li key={i} style={{ color: c.pass ? "var(--ok)" : "#C0392B", display: "flex", alignItems: "center", gap: 5 }}>
                      {c.pair}: {c.ratio}:1 (need {c.threshold})
                      {c.pass ? (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      ) : (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      )}
                    </li>
                  ))}
                </ul>
              </details>
            </div>
          );
        })}
      </div>

      <p className="admin-note" style={{ marginTop: 18 }}>
        Live preview: open the public site in a new tab and use the theme dock
        (bottom-right) to switch presets. Edit colors in the database via the
        <code> theme_presets </code> table, or add a dedicated editor form here
        in a follow-up.
      </p>
    </AdminShell>
  );
}

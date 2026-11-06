import { Suspense } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { getThemePresets, getThemeVisitorSwitch } from "@/lib/cms";
import { resetThemesAction, saveThemeVisitorSwitchAction } from "@/app/(admin)/actions";
import { ThemeRow } from "@/components/admin/ThemeRow";

async function ThemesInner({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const sp = await searchParams;
  await requireAdmin();
  const [presets, visitorSwitch] = await Promise.all([getThemePresets(), getThemeVisitorSwitch()]);

  const errors: Record<string, string> = {
    default: "The default theme cannot be disabled — choose another default first.",
    last: "At least one theme must stay enabled.",
    unknown: "Unknown preset.",
  };

  return (
    <AdminShell current="/admin/themes" heading="Visitor themes">
      <p className="admin-note">
        Choose which of the 9 themes visitors can pick and which one is the
        default. Stored in the <code>theme_presets</code> table; the visitor
        switch hides the picker entirely when off.
      </p>
      {sp.saved ? <p className="chip ok" style={{ marginBottom: 12 }}>Saved.</p> : null}
      {sp.error ? <p className="chip bad" style={{ marginBottom: 12 }}>{errors[sp.error] ?? "Something went wrong."}</p> : null}

      {/* Mockup slide "Visitor themes": visitor switch + reset */}
      <div className="c" style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <form action={saveThemeVisitorSwitchAction} style={{ display: "inline-flex", gap: 8, alignItems: "center", flex: 1 }}>
            <div className="gr" style={{ flex: 1 }}>
              <b style={{ fontWeight: 600 }}>Allow visitors to switch themes</b>
              <small style={{ display: "block", color: "var(--mut2)", fontSize: 12.5 }}>
                When off, the picker is hidden and the default theme is used
              </small>
            </div>
            <label style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, color: "var(--mut2)" }}>
              <input type="checkbox" name="visitor_switch" defaultChecked={visitorSwitch} />
              {visitorSwitch ? "on" : "off"}
            </label>
            <button type="submit" className="btn s">Save</button>
          </form>
          <form action={resetThemesAction}>
            <button type="submit" className="btn">Reset to defaults</button>
          </form>
        </div>
      </div>

      <div className="c">
        <h3>Themes <span className="chip">{presets.filter((p) => p.enabled).length} of 9 enabled</span></h3>
        {presets.map((p) => (
          <ThemeRow
            key={p.key}
            preset={{
              key: p.key,
              name: p.name,
              enabled: p.enabled,
              isDefault: p.isDefault,
              tokens: p.tokens as Record<string, string>,
            }}
          />
        ))}
        <div className="note">
          You cannot disable the default theme or the last enabled theme.
          Contrast pairs follow WCAG AA (4.5:1); the white-on-accent pair is
          borderline on the default accent — see the failing pair in details.
        </div>
      </div>
    </AdminShell>
  );
}

export default function ThemesPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  return (
    <Suspense fallback={null}>
      <ThemesInner searchParams={searchParams} />
    </Suspense>
  );
}

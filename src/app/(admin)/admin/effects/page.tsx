import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { saveEffectsAction } from "@/app/(admin)/actions";
import { getEffectsSettings, type EffectsSettings } from "@/lib/cms";

/**
 * Which visitor-facing group each effect belongs to. A group is offered to
 * visitors only while at least one of its effects stays enabled here.
 */
const GROUPS: { name: string; group: "Animation" | "Magical cursor" | "Magical animation"; rows: { key: keyof Omit<EffectsSettings, "master" | "default_mode" | "touch_disable" | "intensity">; label: string; hint: string }[] }[] = [
  {
    name: "Animation",
    group: "Animation",
    rows: [
      { key: "tilt", label: "3D tilt cards", hint: "Cards tilt a few degrees under the pointer" },
      { key: "parallax", label: "Hero parallax", hint: "Portrait drifts while scrolling" },
      { key: "scramble", label: "Text scramble", hint: "Headline resolves from shuffled glyphs, once per session" },
      { key: "counters", label: "Animated counters", hint: "Stats count up when scrolled into view" },
    ],
  },
  {
    name: "Magical cursor",
    group: "Magical cursor",
    rows: [
      { key: "mascot", label: "Mascot butterfly", hint: "The login-scene butterfly tours the site" },
      { key: "trail", label: "Cursor sparkle trail", hint: "Accent sparks following the pointer" },
      { key: "ripple", label: "Click ripple", hint: "Quiet ring on every click" },
      { key: "magnetic", label: "Magnetic buttons", hint: "Buttons ease toward a nearby pointer" },
    ],
  },
  {
    name: "Magical animation",
    group: "Magical animation",
    rows: [
      { key: "aurora", label: "Aurora glow", hint: "Slow accent blobs behind the page" },
      { key: "network", label: "Network background", hint: "Constellation canvas in the hero" },
    ],
  },
];

export default async function EffectsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  await requireAdmin();
  const { saved } = await searchParams;
  const fx = await getEffectsSettings();

  return (
    <AdminShell current="/admin/effects" heading="Effects Manager">
      <p className="admin-note">
        Admin control is a hard off: a group reaches visitors only while at
        least one of its effects stays enabled here — a disabled group is not
        rendered, its code is never loaded, and its switch does not appear in
        the visitor panel. Visitors can only turn OFF what you allow.
      </p>
      {saved ? <p className="admin-check pass">Saved.</p> : null}
      <form action={saveEffectsAction} className="admin-editor" style={{ display: "grid", gap: 14, maxWidth: 620, marginTop: 8 }}>
        <label className="admin-check" style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input type="checkbox" name="master" defaultChecked={fx.master} />
          <b>Master switch — effects enabled site-wide</b>
        </label>

        {GROUPS.map((g) => (
          <fieldset key={g.name} style={{ border: "1px solid var(--line)", borderRadius: 12, padding: "12px 14px", display: "grid", gap: 8 }}>
            <legend style={{ fontSize: 13, color: "var(--mute)", padding: "0 6px" }}>
              {g.group} group
            </legend>
            {g.rows.map((r) => (
              <label key={r.key} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 14 }}>
                <input type="checkbox" name={r.key} defaultChecked={fx[r.key]} />
                <span>
                  {r.label} <span style={{ color: "var(--mute)", fontSize: 12.5 }}>— {r.hint}</span>
                </span>
              </label>
            ))}
          </fieldset>
        ))}

        <div style={{ display: "grid", gap: 10 }}>
          <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 14 }}>
            <span>
              Default for first-time visitors:{" "}
              <select name="default_mode" defaultValue={fx.default_mode} style={{ font: "inherit", padding: "6px 8px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--panel)", color: "var(--ink)" }}>
                <option value="full">Full</option>
                <option value="lite">Lite</option>
              </select>{" "}
              <span style={{ color: "var(--mute)", fontSize: 12.5 }}>(Lite starts effects off on touch / ≤4 GB RAM / data-saver)</span>
            </span>
          </label>
          <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 14 }}>
            <input type="checkbox" name="touch_disable" defaultChecked={fx.touch_disable} />
            <span>
              <b>Disable heavy effects on touch/mobile</b>{" "}
              <span style={{ color: "var(--mute)", fontSize: 12.5 }}>— hides the cursor group on coarse pointers (default on)</span>
            </span>
          </label>
          <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 14 }}>
            <input type="checkbox" name="override_reduced" defaultChecked={fx.override_reduced} />
            <span>
              <b>Ignore visitors' reduced-motion setting</b>{" "}
              <span style={{ color: "var(--mute)", fontSize: 12.5 }}>— force effects even when the visitor's OS asks for less motion (off = accessibility-respecting default)</span>
            </span>
          </label>
          <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 14 }}>
            <span>
              Effects intensity:{" "}
              <select name="intensity" defaultValue={fx.intensity} style={{ font: "inherit", padding: "6px 8px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--panel)", color: "var(--ink)" }}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>{" "}
              <span style={{ color: "var(--mute)", fontSize: 12.5 }}>— scales particle counts and glow strength</span>
            </span>
          </label>
        </div>

        <div>
          <button type="submit" className="btn p">Save effects</button>
        </div>
      </form>
      <p className="admin-note" style={{ marginTop: 14 }}>
        Stored in <code>site_settings</code> under <code>effects_settings</code>,
        revalidated with <code>updateTag(&quot;content&quot;)</code> on save.
        Effect code is lazy-loaded per group after page load — disabled groups
        never reach the browser.
      </p>
    </AdminShell>
  );
}

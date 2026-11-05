import { AdminShell } from "@/components/admin/AdminShell";
import { saveEffectsAction } from "@/app/(admin)/actions";
import { getEffectsSettings, type EffectsSettings } from "@/lib/cms";

const ROWS: { key: keyof Omit<EffectsSettings, "master" | "lite_mode">; label: string; hint: string }[] = [
  { key: "network", label: "Network background", hint: "Constellation canvas in the hero" },
  { key: "trail", label: "Cursor sparkle trail", hint: "Accent sparks following the pointer" },
  { key: "ripple", label: "Click ripple", hint: "Quiet ring on every click" },
  { key: "magnetic", label: "Magnetic buttons", hint: "Buttons ease toward a nearby pointer" },
  { key: "tilt", label: "3D tilt cards", hint: "Cards tilt a few degrees under the pointer" },
  { key: "mascot", label: "Mascot butterfly", hint: "The login-scene butterfly tours the site" },
  { key: "aurora", label: "Aurora glow", hint: "Slow accent blobs behind the page" },
  { key: "parallax", label: "Hero parallax", hint: "Portrait drifts while scrolling" },
  { key: "scramble", label: "Text scramble", hint: "Headline resolves from shuffled glyphs, once per session" },
  { key: "counters", label: "Animated counters", hint: "Stats count up when scrolled into view" },
];

export default async function EffectsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { saved } = await searchParams;
  const fx = await getEffectsSettings();

  return (
    <AdminShell current="/admin/effects" heading="Effects Manager">
      <p className="admin-note">
        Defaults for every visitor. Effects are desktop-only and disable
        themselves for reduced-motion users. Visitors can fine-tune their own
        set from the &quot;Admin preview&quot; panel; their choices persist.
      </p>
      {saved ? <p className="admin-check pass">Saved.</p> : null}
      <form action={saveEffectsAction} className="admin-editor" style={{ display: "grid", gap: 14, maxWidth: 560, marginTop: 8 }}>
        <label className="admin-check" style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input type="checkbox" name="master" defaultChecked={fx.master} />
          <b>Master switch — effects enabled site-wide</b>
        </label>

        <fieldset style={{ border: "1px solid var(--line)", borderRadius: 12, padding: "12px 14px", display: "grid", gap: 8 }}>
          <legend style={{ fontSize: 13, color: "var(--mute)", padding: "0 6px" }}>Per-effect defaults</legend>
          {ROWS.map((r) => (
            <label key={r.key} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 14 }}>
              <input type="checkbox" name={r.key} defaultChecked={fx[r.key]} />
              <span>
                {r.label} <span style={{ color: "var(--mute)", fontSize: 12.5 }}>— {r.hint}</span>
              </span>
            </label>
          ))}
        </fieldset>

        <label className="admin-check" style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input type="checkbox" name="lite_mode" defaultChecked={fx.lite_mode} />
          <span>
            <b>Lite mode</b>{" "}
            <span style={{ color: "var(--mute)", fontSize: 12.5 }}>
              — start effects off on slow devices (≤4 GB RAM / data-saver) until the visitor opts in
            </span>
          </span>
        </label>

        <div>
          <button type="submit" className="btn p">Save effects</button>
        </div>
      </form>
      <p className="admin-note" style={{ marginTop: 14 }}>
        Stored in <code>site_settings</code> under the key{" "}
        <code>effects_settings</code> and applied pre-paint on every page — no
        flash, no layout shift. New effect toggles appear here and in the
        visitor panel together.
      </p>
    </AdminShell>
  );
}

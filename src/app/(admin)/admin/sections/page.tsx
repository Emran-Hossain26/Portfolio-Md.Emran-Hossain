import { AdminShell } from "@/components/admin/AdminShell";
import { saveRowAction, moveSectionAction } from "@/app/(admin)/actions";
import { getSections } from "@/lib/cms";

export default async function SectionsPage() {
  const rows = await getSections();
  return (
    <AdminShell heading="Sections">
      <p style={{ color: "var(--mut2)", fontSize: 14, marginBottom: 14 }}>
        Turn sections on or off and reorder them on the public site.
      </p>
      <div className="av2-c" style={{ maxWidth: 640 }}>
        {rows.map((r, i) => (
          <div className="av2-row" key={r.key}>
            <span className="av2-chip">{i + 1}</span>
            <div className="gr">
              <code>{r.key}</code>
            </div>
            <form action={moveSectionAction.bind(null, r.key, "up")}>
              <button type="submit" className="av2-btn s" disabled={i === 0} aria-label={"Move " + r.key + " up"}>↑</button>
            </form>
            <form action={moveSectionAction.bind(null, r.key, "down")}>
              <button type="submit" className="av2-btn s" disabled={i === rows.length - 1} aria-label={"Move " + r.key + " down"}>↓</button>
            </form>
            <form action={saveRowAction.bind(null, "sections", r.key)} className="admin-editor" style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
              <input type="hidden" name="key" value={r.key} />
              <input type="hidden" name="sort_order" value={r.sort_order} />
              <input type="hidden" name="enabled" value={r.enabled ? "on" : ""} />
              <label style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, color: "var(--mut2)" }}>
                <input type="checkbox" name="enabled" defaultChecked={r.enabled} />
                enabled
              </label>
              <button type="submit" className="av2-btn s">Save</button>
            </form>
          </div>
        ))}
        {rows.length === 0 ? (
          <p className="av2-note">No sections in the database yet — run the migrations first.</p>
        ) : null}
      </div>
    </AdminShell>
  );
}

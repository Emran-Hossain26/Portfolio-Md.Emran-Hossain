import { AdminShell } from "@/components/admin/AdminShell";
import { saveRowAction, moveSectionAction } from "@/app/(admin)/actions";
import { getSections } from "@/lib/cms";

/** Friendly labels for the sections-table keys (mockup slide "Sections"). */
const LABELS: Record<string, string> = {
  hero: "Hero",
  expertise: "What I do",
  skills: "Tech stack & tools",
  stats: "Proof in numbers",
  projects: "Projects",
  certifications: "Certifications",
  reviews: "Reviews",
  faq: "FAQ",
  now: "Now",
  blog: "Blog",
  contact: "Contact",
};

export default async function SectionsPage() {
  const rows = await getSections();
  const enabled = rows.filter((r) => r.enabled && r.key !== "hero");

  return (
    <AdminShell heading="Sections">
      <p style={{ color: "var(--mut2)", fontSize: 14, marginBottom: 14 }}>
        Turn sections on or off and reorder them on the public site — this now
        controls the real homepage (Stage 6).
      </p>
      <div className="g e2">
        <div className="c" style={{ maxWidth: 640 }}>
          <h3>Order</h3>
          {rows.map((r, i) => (
            <div className="row" key={r.key}>
              <span className="chip">{i + 1}</span>
              <div className="gr">
                {LABELS[r.key] ?? r.key}
                {r.key === "hero" ? <small>Always shown</small> : null}
              </div>
              <form action={moveSectionAction.bind(null, r.key, "up")}>
                <button type="submit" className="btn s" disabled={i === 0} aria-label={"Move " + r.key + " up"}>↑</button>
              </form>
              <form action={moveSectionAction.bind(null, r.key, "down")}>
                <button type="submit" className="btn s" disabled={i === rows.length - 1} aria-label={"Move " + r.key + " down"}>↓</button>
              </form>
              {r.key !== "hero" ? (
                <form action={saveRowAction.bind(null, "sections", r.key)} className="admin-editor" style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                  <input type="hidden" name="key" value={r.key} />
                  <input type="hidden" name="sort_order" value={r.sort_order} />
                  <input type="hidden" name="enabled" value={r.enabled ? "on" : ""} />
                  <label style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, color: "var(--mut2)" }}>
                    <input type="checkbox" name="enabled" defaultChecked={r.enabled} />
                    enabled
                  </label>
                  <button type="submit" className="btn s">Save</button>
                </form>
              ) : null}
            </div>
          ))}
          {rows.length === 0 ? (
            <p className="note">No sections in the database yet — run the migrations first.</p>
          ) : null}
        </div>

        {/* Mockup slide "Sections": live preview of the enabled order */}
        <div className="c">
          <h3>Live preview <span className="chip">mobile</span></h3>
          <div className="pv">
            {enabled.length ? (
              enabled.map((r) => (
                <div
                  key={r.key}
                  style={{
                    border: "1px solid var(--line)",
                    background: "var(--card)",
                    borderRadius: 10,
                    padding: "9px 12px",
                    marginBottom: 8,
                    fontWeight: 500,
                  }}
                >
                  {LABELS[r.key] ?? r.key}
                </div>
              ))
            ) : (
              <p className="mute" style={{ margin: 0, fontSize: 14 }}>No sections enabled.</p>
            )}
          </div>
          <div className="note">Sections without content (e.g. an empty Now list) stay hidden on the public site.</div>
        </div>
      </div>
    </AdminShell>
  );
}

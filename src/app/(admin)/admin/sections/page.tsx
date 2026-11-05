import { AdminShell } from "@/components/admin/AdminShell";
import { saveRowAction, moveSectionAction } from "@/app/(admin)/actions";
import { getSections } from "@/lib/cms";

export default async function SectionsPage() {
  const rows = await getSections();
  return (
    <AdminShell current="/admin/sections" heading="Section manager">
      <p className="admin-note">
        Reorder with arrows. Toggle a section off to hide it site-wide. Live
        preview: open the public site in a new tab.
      </p>
      <a className="btn" href="/" target="_blank" rel="noopener noreferrer" style={{ marginBottom: 14 }}>
        Open live preview →
      </a>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Key</th>
            <th>Order</th>
            <th>Enabled</th>
            <th>Move</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.key}>
              <td>
                <code>{r.key}</code>
              </td>
              <td>{r.sort_order}</td>
              <td>
                <form
                  action={saveRowAction.bind(null, "sections", r.key)}
                  className="admin-editor"
                  style={{ display: "inline-flex", gap: 6, alignItems: "center" }}
                >
                  <input type="hidden" name="key" value={r.key} />
                  <input type="hidden" name="sort_order" value={r.sort_order} />
                  <label style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13 }}>
                    <input type="checkbox" name="enabled" defaultChecked={r.enabled} />
                    enabled
                  </label>
                  <button type="submit" className="btn">
                    Save
                  </button>
                </form>
              </td>
              <td style={{ display: "flex", gap: 6 }}>
                <form action={moveSectionAction.bind(null, r.key, "up")}>
                  <button type="submit" className="btn" disabled={i === 0} aria-label={`Move ${r.key} up`}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ display: "block" }}>
                      <path d="m18 15-6-6-6 6" />
                    </svg>
                  </button>
                </form>
                <form action={moveSectionAction.bind(null, r.key, "down")}>
                  <button type="submit" className="btn" disabled={i === rows.length - 1} aria-label={`Move ${r.key} down`}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ display: "block" }}>
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 ? (
        <p className="admin-note">
          No sections in the database yet. Run{" "}
          <code>supabase/migrations/20250104_initial_schema.sql</code> (it seeds
          the default sections).
        </p>
      ) : null}
    </AdminShell>
  );
}

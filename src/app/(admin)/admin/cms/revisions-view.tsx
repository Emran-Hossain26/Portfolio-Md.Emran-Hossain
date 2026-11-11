import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { fetchRevisions, fetchCmsRow, type CmsModule } from "./data";
import { restoreRevisionAction } from "./actions";

const MODULE_BASE: Record<CmsModule, string> = {
  projects: "/admin/projects",
  services: "/admin/services",
  experience: "/admin/experience",
};

const KEY_FIELDS = [
  "title_en", "title_bn", "problem_en", "solution_en", "features_en", "tech",
  "desc_en", "full_desc_en", "icon", "price", "tags",
  "role_en", "org_en", "employment_type", "start_date", "end_date", "is_current",
  "details", "achievements_en", "period", "featured", "sort_order", "sort", "pub_status",
];

/** Compact diff of one revision: only fields whose JSON changed. */
function diffPairs(oldV: Record<string, unknown> | null, newV: Record<string, unknown> | null) {
  const o = oldV ?? {};
  const n = newV ?? {};
  const keys = new Set([...KEY_FIELDS, ...Object.keys(o), ...Object.keys(n)]);
  return [...keys].filter((k) => JSON.stringify(o[k]) !== JSON.stringify(n[k]));
}

const short = (v: unknown) => {
  const s = JSON.stringify(v ?? "");
  return s && s !== '""' ? s.slice(1, 90) : "—";
};

/** Task U4 revision history: view, compare and restore (append-only). */
export async function CmsRevisions({
  module,
  id,
}: {
  module: CmsModule;
  id: string;
}) {
  await requireAdmin();
  const base = MODULE_BASE[module];
  const row = await fetchCmsRow(module, id);
  if (!row) notFound();
  const revisions = await fetchRevisions(module, id);
  const name = String(row.title_en ?? row.role_en ?? row.slug ?? id);

  return (
    <AdminShell current={base} heading={`Revision history — ${name}`}>
      <p className="admin-note">
        Every content edit snapshots the previous record before saving. Restoring writes the current state as a
        new revision first — history is never overwritten. <Link href={`${base}/${id}`}>← Back to editor</Link>
      </p>

      {revisions.length === 0 ? (
        <div className="c" style={{ color: "var(--mut)" }}>
          No revisions yet — they appear after the first edit of this record.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {revisions.map((rev) => {
            const changed = diffPairs(rev.old_value, rev.new_value);
            return (
              <div className="c" key={rev.revision_no}>
                <h3 style={{ marginBottom: 6 }}>
                  Revision #{rev.revision_no}
                  <span style={{ color: "var(--mut)", fontWeight: 400, fontSize: 13, marginLeft: 10 }}>
                    {new Date(rev.created_at).toLocaleString()}
                    {rev.admin_email ? ` · by ${rev.admin_email}` : ""}
                  </span>
                </h3>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ color: "var(--mut)", textAlign: "left" }}>
                      <th style={{ padding: "4px 8px", borderBottom: "1px solid var(--line)" }}>Field</th>
                      <th style={{ padding: "4px 8px", borderBottom: "1px solid var(--line)" }}>Before</th>
                      <th style={{ padding: "4px 8px", borderBottom: "1px solid var(--line)" }}>After</th>
                    </tr>
                  </thead>
                  <tbody>
                    {changed.length === 0 ? (
                      <tr><td colSpan={3} style={{ padding: "6px 8px", color: "var(--mut)" }}>No tracked field changes.</td></tr>
                    ) : (
                      changed.map((k) => (
                        <tr key={k}>
                          <td style={{ padding: "4px 8px", borderBottom: "1px solid var(--line)" }}><code>{k}</code></td>
                          <td style={{ padding: "4px 8px", borderBottom: "1px solid var(--line)", color: "var(--bad)" }}>{short(rev.old_value?.[k])}</td>
                          <td style={{ padding: "4px 8px", borderBottom: "1px solid var(--line)", color: "var(--ok)" }}>{short(rev.new_value?.[k])}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                <form action={restoreRevisionAction.bind(null, module, id, rev.revision_no)} style={{ marginTop: 10 }}>
                  <button className="btn s p" type="submit">Restore this revision</button>
                </form>
              </div>
            );
          })}
        </div>
      )}
    </AdminShell>
  );
}

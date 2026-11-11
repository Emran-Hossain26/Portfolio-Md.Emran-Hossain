import { Suspense } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { adminConfigured, createServiceClient } from "@/lib/supabase/service";

type AuditRow = {
  id: string;
  user_email: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  old_value: unknown;
  new_value: unknown;
  created_at: string;
};

const TONE: Record<string, string> = {
  create: "ok",
  content_created: "ok",
  content_updated: "",
  content_published: "ok",
  content_unpublished: "warn",
  content_archived: "warn",
  content_moved_to_trash: "warn",
  content_restored: "ok",
  content_permanently_deleted: "bad",
  content_duplicated: "acc",
  content_reordered: "",
  revision_restored: "acc",
  update: "",
  delete: "bad",
  password_change: "warn",
  "2fa_enabled": "ok",
  "2fa_disabled": "warn",
  quick_reply: "acc",
};

/** Task U4 activity log: module/action/user/date filters + CSV export. */
async function AuditInner({
  searchParams,
}: {
  searchParams: Promise<{ module?: string; action?: string; who?: string; from?: string; to?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;

  let rows: AuditRow[] = [];
  if (adminConfigured()) {
    try {
      let q = createServiceClient()
        .from("audit_log")
        .select("id,user_email,action,entity_type,entity_id,old_value,new_value,created_at")
        .order("created_at", { ascending: false })
        .limit(300);
      if (sp.module) q = q.eq("entity_type", sp.module);
      if (sp.action) q = q.eq("action", sp.action);
      if (sp.who) q = q.ilike("user_email", `%${sp.who}%`);
      if (sp.from) q = q.gte("created_at", new Date(sp.from).toISOString());
      if (sp.to) q = q.lte("created_at", new Date(`${sp.to}T23:59:59`).toISOString());
      const { data } = await q;
      rows = (data ?? []) as AuditRow[];
    } catch {
      rows = [];
    }
  }

  // Distinct filters from the loaded window (kept simple and server-side).
  const modules = [...new Set(rows.map((r) => r.entity_type).filter(Boolean))] as string[];
  const actions = [...new Set(rows.map((r) => r.action).filter(Boolean))] as string[];

  return (
    <AdminShell heading="Activity log & audit trail">
      <p style={{ color: "var(--mut2)", fontSize: 14, marginBottom: 14 }}>
        Who changed what — every admin save, publish, trash, bulk action and more
        (<code>audit_log</code>, append-only). Export:
        <Link className="btn s" href="/api/admin/audit-csv" style={{ marginLeft: 8 }}>Download CSV</Link>
      </p>

      <div className="c" style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 14 }}>
        <form action="/admin/audit" method="get" style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
          <label style={{ fontSize: 13 }}>Module
            <select name="module" defaultValue={sp.module ?? ""}>
              <option value="">all</option>
              {modules.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </label>
          <label style={{ fontSize: 13 }}>Action
            <select name="action" defaultValue={sp.action ?? ""}>
              <option value="">all</option>
              {actions.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </label>
          <label style={{ fontSize: 13 }}>User contains
            <input type="text" name="who" defaultValue={sp.who ?? ""} placeholder="email part" />
          </label>
          <label style={{ fontSize: 13 }}>From
            <input type="date" name="from" defaultValue={sp.from ?? ""} />
          </label>
          <label style={{ fontSize: 13 }}>To
            <input type="date" name="to" defaultValue={sp.to ?? ""} />
          </label>
          <button className="btn p s" type="submit">Filter</button>
          <Link className="btn s" href="/admin/audit">Clear</Link>
        </form>
      </div>

      {rows.length === 0 ? (
        <p className="note">
          No audit events for this filter. Perform a save in any editor and it appears here.
        </p>
      ) : (
        <div className="c" style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>When</th>
                <th>Who</th>
                <th>Action</th>
                <th>Module</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const nv = (r.new_value ?? {}) as Record<string, unknown>;
                const prev = nv.prev_status ? String(nv.prev_status) : "";
                const next = nv.new_status ? String(nv.new_status) : "";
                const name = nv.name ? String(nv.name) : "";
                return (
                  <tr key={r.id}>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {new Date(r.created_at).toLocaleString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td>{r.user_email ?? "system"}</td>
                    <td>
                      <span className={"chip " + (TONE[r.action] ?? "")}>{r.action}</span>
                    </td>
                    <td>
                      {r.entity_type ?? "—"}
                      <small style={{ color: "var(--mut2)" }}> · {r.entity_id?.slice(0, 8)}</small>
                      {name ? <small style={{ display: "block", color: "var(--mut2)" }}>{name}</small> : null}
                    </td>
                    <td>
                      {prev || next ? (
                        <span style={{ fontSize: 13 }}>
                          {prev || "—"} → <b>{next}</b>
                        </span>
                      ) : null}
                      {r.old_value || r.new_value ? (
                        <details>
                          <summary style={{ cursor: "pointer", fontSize: 13 }}>diff</summary>
                          <pre style={{ fontSize: 11, maxWidth: 420, whiteSpace: "pre-wrap", margin: "6px 0 0" }}>
                            {r.old_value ? `OLD ${JSON.stringify(r.old_value, null, 1)}\n` : ""}
                            {r.new_value ? `NEW ${JSON.stringify(r.new_value, null, 1)}` : ""}
                          </pre>
                        </details>
                      ) : !prev && !next ? (
                        "—"
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}

export default function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ module?: string; action?: string; who?: string; from?: string; to?: string }>;
}) {
  return (
    <Suspense fallback={null}>
      <AuditInner searchParams={searchParams} />
    </Suspense>
  );
}

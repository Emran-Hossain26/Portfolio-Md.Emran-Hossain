import { Suspense } from "react";
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
  update: "",
  delete: "bad",
  password_change: "warn",
  "2fa_enabled": "ok",
  "2fa_disabled": "warn",
  quick_reply: "acc",
};

async function AuditInner() {
  await requireAdmin();

  let rows: AuditRow[] = [];
  if (adminConfigured()) {
    try {
      const { data } = await createServiceClient()
        .from("audit_log")
        .select("id,user_email,action,entity_type,entity_id,old_value,new_value,created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      rows = (data ?? []) as AuditRow[];
    } catch {
      rows = [];
    }
  }

  return (
    <AdminShell heading="Audit log">
      <p style={{ color: "var(--mut2)", fontSize: 14, marginBottom: 14 }}>
        Who changed what — last 200 events. Written automatically by every
        admin save/delete (table: <code>audit_log</code>, migration 20261110).
      </p>

      {rows.length === 0 ? (
        <p className="note">
          No audit events yet. Perform a save in any editor and it appears here.
          If entries never appear, run the 20261110 migration in Supabase.
        </p>
      ) : (
        <div className="c" style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>When</th>
                <th>Who</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td style={{ whiteSpace: "nowrap" }}>
                    {new Date(r.created_at).toLocaleString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td>{r.user_email ?? "—"}</td>
                  <td>
                    <span className={"chip " + (TONE[r.action] ?? "")}>{r.action}</span>
                  </td>
                  <td>
                    {r.entity_type ?? "—"}
                    {r.entity_id ? <small style={{ color: "var(--mut2)" }}> · {r.entity_id}</small> : null}
                  </td>
                  <td>
                    {r.old_value || r.new_value ? (
                      <details>
                        <summary style={{ cursor: "pointer", fontSize: 13 }}>diff</summary>
                        <pre style={{ fontSize: 11, maxWidth: 420, whiteSpace: "pre-wrap", margin: "6px 0 0" }}>
                          {r.old_value ? `OLD ${JSON.stringify(r.old_value, null, 1)}\n` : ""}
                          {r.new_value ? `NEW ${JSON.stringify(r.new_value, null, 1)}` : ""}
                        </pre>
                      </details>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}

export default function AuditPage() {
  return (
    <Suspense fallback={null}>
      <AuditInner />
    </Suspense>
  );
}

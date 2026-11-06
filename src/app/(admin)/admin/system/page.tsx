import { Suspense } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { createServiceClient, adminConfigured } from "@/lib/supabase/service";
import { saveMaintenanceAction } from "@/app/(admin)/actions";

async function maintenanceEnabled(): Promise<boolean> {
  if (!adminConfigured()) return false;
  try {
    const db = createServiceClient();
    const { data } = await db
      .from("site_settings")
      .select("value")
      .eq("key", "maintenance_mode")
      .maybeSingle();
    return Boolean((data?.value as { enabled?: boolean } | null)?.enabled);
  } catch {
    return false;
  }
}

async function SystemInner({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { saved } = await searchParams;
  await requireAdmin();
  const maint = await maintenanceEnabled();

  return (
    <AdminShell heading="System">
      <p style={{ color: "var(--mut2)", fontSize: 14, marginBottom: 14 }}>
        Safety, backups and site-wide controls.
      </p>
      {saved ? <p className="chip ok" style={{ marginBottom: 12 }}>Saved.</p> : null}
      <div className="g e2">
        <div className="c">
          <h3>Controls</h3>
          <form action={saveMaintenanceAction}>
            <div className="row">
              <div className="gr">
                Maintenance mode
                <small>Shows a friendly back-soon page to visitors</small>
              </div>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, color: "var(--mut2)" }}>
                <input type="checkbox" name="maintenance" defaultChecked={maint} />
                {maint ? "on" : "off"}
              </label>
            </div>
            <div style={{ marginTop: 12 }}>
              <button type="submit" className="btn p">Save</button>
            </div>
          </form>
          <div className="row" style={{ marginTop: 8 }}>
            <div className="gr">
              Backup
              <small>Content as JSON plus media list (after migrations)</small>
            </div>
            <span className="chip">planned</span>
          </div>
          <div className="row">
            <div className="gr">
              Two-factor login
              <small>Authenticator app</small>
            </div>
            <span className="chip warn">not set up</span>
          </div>
          <div className="row">
            <div className="gr">
              Email notifications
              <small>New message alerts (Resend)</small>
            </div>
            <span className="chip">needs API key</span>
          </div>
        </div>
        <div className="c">
          <h3>Roles</h3>
          <div className="row">
            <div className="gr">
              Administrator
              <small>Full access (admins table, is_admin enforced)</small>
            </div>
            <span className="chip acc">you</span>
          </div>
          <div className="note">
            Audit log arrives with the audit-log migration (Stage 5.2 follow-up).
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

export default function SystemPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  return (
    <Suspense fallback={null}>
      <SystemInner searchParams={searchParams} />
    </Suspense>
  );
}

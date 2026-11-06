import { Suspense } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { adminConfigured, createServiceClient } from "@/lib/supabase/service";
import { saveMaintenanceAction, sendTestEmailAction } from "@/app/(admin)/actions";
import { emailConfigured } from "@/lib/email";


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

async function twoFactorEnabled(userId: string): Promise<boolean> {
  if (!adminConfigured()) return false;
  try {
    const db = createServiceClient();
    const { data } = await db
      .from("admins")
      .select("totp_enabled")
      .eq("id", userId)
      .maybeSingle();
    return Boolean((data as { totp_enabled?: boolean } | null)?.totp_enabled);
  } catch {
    return false;
  }
}

async function SystemInner({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; emailsent?: string; emailerror?: string }>;
}) {
  const sp = await searchParams;
  const user = await requireAdmin();
  const maint = await maintenanceEnabled();
  const tfa = await twoFactorEnabled(user.id);

  return (
    <AdminShell heading="System">
      <p style={{ color: "var(--mut2)", fontSize: 14, marginBottom: 14 }}>
        Safety, backups and site-wide controls.
      </p>
      {sp.saved ? <p className="chip ok" style={{ marginBottom: 12 }}>Saved.</p> : null}
      {sp.emailsent ? <p className="chip ok" style={{ marginBottom: 12 }}>Test email sent — check your inbox.</p> : null}
      {sp.emailerror ? (
        <p className="chip bad" style={{ marginBottom: 12 }}>
          {sp.emailerror === "nokey"
            ? "No RESEND_API_KEY in .env.local — add one first."
            : sp.emailerror === "norecipient"
              ? "Set ADMIN_EMAIL (or your account email) as the recipient."
              : "Send failed — check the Resend key / sender domain."}
        </p>
      ) : null}
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
              <small>Content as JSON plus the media list</small>
            </div>
            <Link className="btn s" href="/api/admin/backup">Download backup</Link>
          </div>
          <div className="row">
            <div className="gr">
              Two-factor login
              <small>Authenticator app (setup in Profile &amp; security)</small>
            </div>
            <Link href="/admin/profile" className={"chip " + (tfa ? "ok" : "warn")} style={{ textDecoration: "none" }}>
              {tfa ? "enabled" : "not set up"}
            </Link>
          </div>
          <div className="row">
            <div className="gr">
              Email notifications
              <small>New-review alerts, quick reply (Resend)</small>
            </div>
            <span className={"chip " + (emailConfigured() ? "ok" : "")}>
              {emailConfigured() ? "API key set" : "needs API key"}
            </span>
          </div>
          <form action={sendTestEmailAction} style={{ marginTop: 8 }}>
            <button type="submit" className="btn s">Send test email</button>
          </form>
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
          <div className="row">
            <div className="gr">
              Audit log
              <small>Who changed what — every save is recorded</small>
            </div>
            <Link className="btn s" href="/admin/audit">Open</Link>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

export default function SystemPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; emailsent?: string; emailerror?: string }>;
}) {
  return (
    <Suspense fallback={null}>
      <SystemInner searchParams={searchParams} />
    </Suspense>
  );
}

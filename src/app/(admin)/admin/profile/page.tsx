import { Suspense } from "react";
import { RecoveryCodes } from "@/components/admin/RecoveryCodes";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { adminConfigured, createServiceClient } from "@/lib/supabase/service";
import { Secret, TOTP } from "otpauth";
import QRCode from "qrcode";
import {
  saveAdminProfileAction,
  changePasswordAction,
  startTwoFactorSetupAction,
  confirmTwoFactorAction,
  disableTwoFactorAction,
} from "@/app/(admin)/actions";


const ERRORS: Record<string, string> = {
  size: "Avatar is larger than 4 MB.",
  type: "Use PNG, JPG or WebP.",
  upload: "Upload failed — check the storage bucket.",
  short: "New password must be at least 8 characters.",
  current: "Current password is not correct.",
  update: "Could not change the password — try again.",
  code: "That authenticator code was not valid.",
  setup: "Two-factor setup state is missing — start again.",
};

type AdminRow = {
  totp_secret: string | null;
  totp_enabled: boolean;
};

async function loadAdminRow(userId: string): Promise<AdminRow | null> {
  if (!adminConfigured()) return null;
  try {
    const { data } = await createServiceClient()
      .from("admins")
      .select("totp_secret,totp_enabled")
      .eq("id", userId)
      .maybeSingle();
    return (data ?? null) as AdminRow | null;
  } catch {
    return null;
  }
}

async function loadProfile(): Promise<{ display_name: string; avatar_url: string }> {
  if (!adminConfigured()) return { display_name: "", avatar_url: "" };
  try {
    const { data } = await createServiceClient()
      .from("site_settings")
      .select("value")
      .eq("key", "admin_profile")
      .maybeSingle();
    const v = (data?.value ?? {}) as { display_name?: string; avatar_url?: string };
    return {
      display_name: String(v.display_name ?? "").trim(),
      avatar_url: String(v.avatar_url ?? "").trim(),
    };
  } catch {
    return { display_name: "", avatar_url: "" };
  }
}

async function ProfileInner({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; setup?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const user = await requireAdmin();
  const [profile, adminRow] = await Promise.all([
    loadProfile(),
    loadAdminRow(user.id),
  ]);

  const showSetup = sp.setup === "1" && adminRow?.totp_secret && !adminRow.totp_enabled;
  let qrSvg = "";
  let otpauthUri = "";
  if (showSetup && adminRow?.totp_secret) {
    const totp = new TOTP({
      issuer: "Portfolio Admin",
      label: user.email ?? "admin",
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: Secret.fromBase32(adminRow.totp_secret),
    });
    otpauthUri = totp.toString();
    qrSvg = await QRCode.toString(otpauthUri, { type: "svg", margin: 1, width: 176 });
  }

  return (
    <AdminShell heading="Profile & security">
      <p style={{ color: "var(--mut2)", fontSize: 14, marginBottom: 14 }}>
        Your admin identity in the panel, password, and two-factor login.
      </p>
      {sp.saved ? <p className="chip ok" style={{ marginBottom: 12 }}>Saved.</p> : null}
      {sp.error ? <p className="chip bad" style={{ marginBottom: 12 }}>{ERRORS[sp.error] ?? "Something went wrong."}</p> : null}

      <div className="g e2">
        <div className="c">
          <h3>Profile</h3>
          <form action={saveAdminProfileAction} style={{ display: "grid", gap: 10 }}>
            <label>
              Display name (shown in the sidebar)
              <input
                type="text"
                name="display_name"
                defaultValue={profile?.display_name ?? ""}
                maxLength={80}
                placeholder="Administrator"
              />
            </label>
            <label>
              Avatar (PNG/JPG/WebP, max 4 MB)
              <input type="file" name="avatar" accept=".png,.jpg,.jpeg,.webp" />
            </label>
            {profile?.avatar_url ? (
              <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                <input type="checkbox" name="remove_avatar" />
                Remove current avatar
              </label>
            ) : null}
            <div>
              <button type="submit" className="btn p">Save profile</button>
            </div>
          </form>
          <p className="note" style={{ marginTop: 10 }}>
            Signed in as <b>{user.email}</b>
          </p>
        </div>

        <div className="c">
          <h3>Password</h3>
          <form action={changePasswordAction} style={{ display: "grid", gap: 10 }}>
            <label>
              Current password
              <input type="password" name="current_password" required autoComplete="current-password" />
            </label>
            <label>
              New password (min 8 characters)
              <input type="password" name="new_password" required minLength={8} autoComplete="new-password" />
            </label>
            <div>
              <button type="submit" className="btn p">Change password</button>
            </div>
          </form>
        </div>
      </div>

      <div className="c" style={{ marginTop: 14 }}>
        <h3>Two-factor login (authenticator app)</h3>
        {adminRow?.totp_enabled ? (
          <>
            <p className="chip ok" style={{ marginBottom: 10 }}>enabled — every login asks for a code</p>
            <form action={disableTwoFactorAction} style={{ display: "grid", gap: 10, maxWidth: 320 }}>
              <label>
                Code to confirm switching OFF
                <input type="text" name="code" inputMode="numeric" pattern="[0-9]*" maxLength={6} required />
              </label>
              <div>
                <button type="submit" className="btn" style={{ color: "var(--bad)" }}>Disable 2FA</button>
              </div>
            </form>
          </>
        ) : showSetup && adminRow?.totp_secret ? (
          <>
            <p style={{ color: "var(--mut2)", fontSize: 14 }}>
              1) Scan the QR with Google Authenticator / Authy / any TOTP app
              (or paste the key: <code>{adminRow.totp_secret}</code>).
              2) Enter the 6-digit code to switch 2FA on.
            </p>
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap", marginTop: 8 }}>
              <div
                style={{ background: "#fff", padding: 8, borderRadius: 10, border: "1px solid var(--line)" }}
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
              <form action={confirmTwoFactorAction} style={{ display: "grid", gap: 10, flex: "1 1 240px" }}>
                <label>
                  6-digit code
                  <input
                    type="text"
                    name="code"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="one-time-code"
                    maxLength={6}
                    required
                    autoFocus
                  />
                </label>
                <div>
                  <button type="submit" className="btn p">Confirm &amp; enable</button>
                </div>
                <small style={{ color: "var(--mut2)" }}>
                  Manual setup URI: <code style={{ wordBreak: "break-all" }}>{otpauthUri}</code>
                </small>
              </form>
            </div>
          </>
        ) : (
          <>
            <p className="chip warn" style={{ marginBottom: 10 }}>not set up</p>
            <p style={{ color: "var(--mut2)", fontSize: 14, marginBottom: 10 }}>
              After your password, sign-in will ask for a rotating 6-digit code
              from an authenticator app. The login page itself stays untouched.
            </p>
            <form action={startTwoFactorSetupAction}>
              <button type="submit" className="btn p">Start setup</button>
            </form>
          </>
        )}
        <RecoveryCodes />
      </div>
    </AdminShell>
  );
}

export default function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; setup?: string; error?: string }>;
}) {
  return (
    <Suspense fallback={null}>
      <ProfileInner searchParams={searchParams} />
    </Suspense>
  );
}

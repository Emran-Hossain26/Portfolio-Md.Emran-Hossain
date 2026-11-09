import { Suspense } from "react";
import { redirect } from "next/navigation";
import { requireAdminPending2fa } from "@/lib/supabase/admin-auth";
import { verifyTwoFactorLoginAction } from "@/app/(admin)/actions";


async function Verify2faInner({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;
  const { user, pending } = await requireAdminPending2fa();

  // Authenticated but no pending 2FA (not enabled, or session already valid).
  if (!pending) redirect("/admin");

  return (
    <div style={{ maxWidth: 420, margin: "48px auto" }}>
      <div className="c">
        <h3>Two-factor verification</h3>
        <p style={{ color: "var(--mut2)", fontSize: 14 }}>
          Enter the 6-digit code from your authenticator app for{" "}
          <b>{user.email}</b> to finish signing in.
        </p>
        {sp.error ? (
          sp.error === "locked" ? (
            <p className="chip bad" style={{ marginBottom: 10 }}>
              Too many attempts — try again in a few minutes.
            </p>
          ) : (
            <p className="chip bad" style={{ marginBottom: 10 }}>
              That code was not valid — check the app or use a recovery code.
            </p>
          )
        ) : null}
        <form action={verifyTwoFactorLoginAction} style={{ display: "grid", gap: 10 }}>
          <label>
            Authenticator code — or a recovery code
            <input
              type="text"
              name="code"
              autoComplete="one-time-code"
              maxLength={12}
              autoFocus
              required
            />
          </label>
          <button type="submit" className="btn p">Verify &amp; continue</button>
        </form>
      </div>
    </div>
  );
}

export default function Verify2faPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <Suspense fallback={null}>
      <Verify2faInner searchParams={searchParams} />
    </Suspense>
  );
}

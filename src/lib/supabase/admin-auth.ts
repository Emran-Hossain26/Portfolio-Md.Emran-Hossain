import "server-only";
import { createHash } from "node:crypto";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "./server";

/**
 * Guard for /admin pages and admin actions. Requires a logged-in Supabase
 * user AND public.is_admin() = true (public.admins membership, enforced by
 * RLS/policies). The optional ADMIN_EMAIL env is an extra belt-and-braces
 * allowlist. Uses only the anon key + the user's own session cookie — the
 * service_role key is only touched by the separate admin.ts service client
 * inside trusted server code.
 *
 * Two-factor (Session 2): when the admin has TOTP enabled, a second gate
 * runs AFTER password login — an httpOnly cookie signed against the stored
 * sha256 hash must be present, otherwise every guarded page redirects to
 * /admin/verify-2fa. The login page itself is never involved.
 */

const A2FA_COOKIE = "a2fa";

/** Shared auth core: getUser + allowlist + is_admin. Never checks 2FA. */
async function requireAdminCore() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    redirect("/login?reason=notconfigured");
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) redirect("/login");

  const allowed = (process.env.ADMIN_EMAIL ?? "").toLowerCase();
  if (allowed && user.email?.toLowerCase() !== allowed) {
    await supabase.auth.signOut();
    redirect("/login?reason=unauthorized");
  }

  // The decisive check: admins-table membership via the SQL function.
  const { data: isAdmin, error } = await supabase.rpc("is_admin");
  if (error || isAdmin !== true) {
    await supabase.auth.signOut();
    redirect("/login?reason=notadmin");
  }

  return { user, supabase };
}

export async function requireAdmin() {
  const { user, supabase } = await requireAdminCore();

  // Two-factor gate. Fail-open on infrastructure errors (the row read uses
  // the user's own session against RLS "admins read own row"), strict on
  // mismatch: a missing/wrong cookie always lands on the verify page.
  try {
    const { data: row } = await supabase
      .from("admins")
      .select("totp_enabled,totp_session_hash")
      .eq("id", user.id)
      .maybeSingle();
    if (row?.totp_enabled) {
      const jar = await cookies();
      const token = jar.get(A2FA_COOKIE)?.value ?? "";
      const hash = token
        ? createHash("sha256").update(token).digest("hex")
        : "";
      if (!token || hash !== row.totp_session_hash) {
        redirect("/admin/verify-2fa");
      }
    }
  } catch {
    // infra error (e.g. pre-migration schema) — allow through
  }

  return user;
}

/** Guard for /admin/verify-2fa itself: authenticated admin whose 2FA
 *  session is NOT yet established. Anyone else is sent on their way. */
export async function requireAdminPending2fa() {
  const { user, supabase } = await requireAdminCore();
  let pending = true;
  try {
    const { data: row } = await supabase
      .from("admins")
      .select("totp_enabled,totp_session_hash")
      .eq("id", user.id)
      .maybeSingle();
    if (row?.totp_enabled) {
      const jar = await cookies();
      const token = jar.get(A2FA_COOKIE)?.value ?? "";
      const hash = token
        ? createHash("sha256").update(token).digest("hex")
        : "";
      pending = !token || hash !== row.totp_session_hash;
    } else {
      pending = false; // no 2FA enabled → nothing to verify
    }
  } catch {
    pending = false;
  }
  return { user, pending };
}

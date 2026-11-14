import "server-only";
import { cache } from "react";
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
  const __rpcT0 = Date.now(); // TEMP review instrumentation: reveals function-to-DB latency
  const { data: isAdmin, error } = await supabase.rpc("is_admin");
  console.log(`[auth-dedupe] is_admin rpc ${Date.now() - __rpcT0}ms (region probe) | chain runs: ${__authChainRuns}`);
  if (error || isAdmin !== true) {
    await supabase.auth.signOut();
    redirect("/login?reason=notadmin");
  }

  return { user, supabase };
}

export let __authChainRuns = 0; // TEMP instrumentation (review round) — removed after approval
export const requireAdmin = cache(async function requireAdmin() {
  __authChainRuns += 1;
  console.log(`[auth-dedupe] requireAdmin chain executed (call #${__authChainRuns} since cold start)`);
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
    // FAIL CLOSED (Stage 6): any infra error in the 2FA check denies access.
    await supabase.auth.signOut();
    redirect("/login?reason=generic");
  }

  return user;
});
/** cache() dedupes the whole auth chain (getUser + is_admin + admins row) to
 *  ONE pass per render, even when the outer layout, gate layout AND page each
 *  call requireAdmin() — previously that was 3 × 3 sequential Supabase
 *  round-trips per admin navigation (the main admin-panel bottleneck). */

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
    // FAIL CLOSED: cannot confirm the 2FA state → deny (verify page redirects).
    redirect("/login?reason=generic");
  }
  return { user, pending };
}

import "server-only";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "./server";

/**
 * Guard for /admin pages and admin actions. Requires a logged-in Supabase
 * user AND public.is_admin() = true (public.admins membership, enforced by
 * RLS/policies). The optional ADMIN_EMAIL env is an extra belt-and-braces
 * allowlist. Uses only the anon key + the user's own session cookie — the
 * service_role key is only touched by the separate admin.ts service client
 * inside trusted server code.
 */
export async function requireAdmin() {
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

  return user;
}

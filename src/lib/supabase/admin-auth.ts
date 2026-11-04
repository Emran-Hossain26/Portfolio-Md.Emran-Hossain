import "server-only";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "./server";

/**
 * Guard for /admin pages. Restricts access to the single configured admin
 * email (ADMIN_EMAIL env), independent of RLS.
 */
export async function requireAdmin() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    redirect("/admin/login?reason=notconfigured");
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) redirect("/admin/login");

  const allowed = (process.env.ADMIN_EMAIL ?? "").toLowerCase();
  if (allowed && user.email?.toLowerCase() !== allowed) {
    redirect("/admin/login?reason=unauthorized");
  }
  return user;
}

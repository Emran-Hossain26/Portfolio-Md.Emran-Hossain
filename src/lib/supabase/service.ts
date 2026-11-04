import "server-only";
import { createClient } from "@supabase/supabase-js";

/** Admin panel is considered usable when both URL and service key exist. */
export const adminConfigured = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

/**
 * Service-role client for admin data reading/writing (bypasses RLS).
 * Used ONLY in server actions / server components under /admin.
 */
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

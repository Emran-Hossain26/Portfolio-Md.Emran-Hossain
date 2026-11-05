import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Single, server-only entry point for service-role Supabase access.
 *
 * The service role key bypasses Row Level Security and must NEVER reach the
 * browser. Every caller in the app goes through this module so the
 * `import "server-only"` guard (and the ESLint rule in eslint.config.mjs)
 * can guarantee that no client component ever pulls the key in.
 */

export const adminConfigured = () =>
  Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

/** Service-role client (full access, no session, server-only). */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase service role is not configured (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).",
    );
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

/** Alias kept for callers that prefer the "admin client" name. */
export const createSupabaseAdminClient = createServiceClient;

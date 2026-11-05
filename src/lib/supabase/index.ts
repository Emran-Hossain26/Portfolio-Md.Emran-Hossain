export { createClient } from "./client";
export { createSupabaseServerClient, createSupabaseAdminClient, isSupabaseConfigured } from "./server";
export { createServiceClient, adminConfigured } from "./service";
export { requireAdmin } from "./admin-auth";
export type { Database } from "@/types/supabase";
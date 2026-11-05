// Backward-compatible shim: service-role access now lives in ./admin (server-only).
// Kept so existing imports (`@/lib/supabase/service`) keep working.
export { adminConfigured, createServiceClient } from "./admin";
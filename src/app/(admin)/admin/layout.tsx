import { requireAdmin } from "@/lib/supabase/admin-auth";

export const preferredRegion = "icn1"; // co-located with the Supabase Seoul region — cuts DB round-trip latency

// Stage 6 item 1: blocking route — /admin/* pages NEVER prerender, so an
// unauthenticated request always hits the live guard (307 to /login), never
// a cached shell.
export const instant = false;

/**
 * Stage 6 hardening: defense-in-depth default guard. This layout wraps
 * EVERY /admin/* route (login lives outside it), so a new admin page is
 * protected even if its developer forgets to call requireAdmin().
 * Individual pages/actions keep their own guards (item 1: layered checks).
 */
export default async function AdminGateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return <>{children}</>;
}

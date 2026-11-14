import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { adminConfigured } from "@/lib/supabase/admin";

export const preferredRegion = "icn1"; // co-located with the Supabase Seoul region — cuts DB round-trip latency

/**
 * Lightweight gate for client-side admin-only UI (the "Admin preview" dock
 * on the public site). Returns whether the current session belongs to an
 * admins-table member. No secrets, no PII.
 */
export async function GET() {
  if (!adminConfigured()) return NextResponse.json({ admin: false });
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) return NextResponse.json({ admin: false });
    const { data: isAdmin } = await supabase.rpc("is_admin");
    return NextResponse.json({ admin: isAdmin === true });
  } catch {
    return NextResponse.json({ admin: false });
  }
}

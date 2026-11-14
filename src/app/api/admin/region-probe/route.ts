import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * TEMP (perf investigation): reports the actual function execution region
 * (Vercel injects VERCEL_REGION at runtime). Admin-session gated; no secrets.
 * Remove after the region configuration is verified.
 */
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return NextResponse.json(
      { error: "unauthorized", vercelRegion: process.env.VERCEL_REGION ?? "(unset)" },
      { status: 401 },
    );
  }
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (isAdmin !== true) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  return NextResponse.json({
    vercelRegion: process.env.VERCEL_REGION ?? "(unset — default region)",
    note: "icn1 = Seoul (co-located with Supabase)",
  });
}

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { adminConfigured, createServiceClient } from "@/lib/supabase/admin";

/**
 * Newsletter subscribers CSV export for /admin/newsletter (MISSING-TASKS
 * A13). Inline auth (session + is_admin), else 401 — API routes never
 * redirect to the login page.
 */

function csvCell(v: unknown): string {
  const s = String(v ?? "");
  return /[",\n\r]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

export async function GET() {
  if (!adminConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (isAdmin !== true) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let rows: { email: string; locale: string; status: string; created_at: string }[] = [];
  try {
    const { data } = await createServiceClient()
      .from("newsletter_subscribers")
      .select("email,locale,status,created_at")
      .order("created_at", { ascending: false });
    rows = (data ?? []) as typeof rows;
  } catch {
    rows = [];
  }

  const lines = ["email,locale,status,joined"];
  for (const r of rows) {
    lines.push([r.email, r.locale, r.status, r.created_at].map(csvCell).join(","));
  }
  const csv = lines.join("\r\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

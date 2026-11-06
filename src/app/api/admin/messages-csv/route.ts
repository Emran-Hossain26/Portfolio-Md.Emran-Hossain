import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { adminConfigured, createServiceClient } from "@/lib/supabase/admin";

/**
 * Mockup slide "Inbox": Export CSV. Inline auth (session + is_admin), else 401.
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
  if (!userData.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (isAdmin !== true) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let rows: { name: string; email: string; subject: string; message: string; status: string; created_at: string }[] = [];
  try {
    const { data } = await createServiceClient()
      .from("messages")
      .select("name,email,subject,message,status,created_at")
      .order("created_at", { ascending: false });
    rows = (data ?? []) as typeof rows;
  } catch {
    rows = [];
  }

  const lines = ["name,email,subject,status,received,message"];
  for (const r of rows) {
    lines.push([r.name, r.email, r.subject, r.status, r.created_at, r.message].map(csvCell).join(","));
  }

  return new NextResponse(lines.join("\r\n"), {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="messages-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

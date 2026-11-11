import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { adminConfigured, createServiceClient } from "@/lib/supabase/admin";

/**
 * Task U4: activity-log CSV export. Same inline auth as messages-csv
 * (session + is_admin), else 401/403. Read-only over audit_log.
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

  let rows: {
    id: string;
    created_at: string;
    user_email: string | null;
    action: string;
    entity_type: string | null;
    entity_id: string | null;
    new_value: unknown;
  }[] = [];
  try {
    const { data } = await createServiceClient()
      .from("audit_log")
      .select("id,created_at,user_email,action,entity_type,entity_id,new_value")
      .order("created_at", { ascending: false })
      .limit(2000);
    rows = (data ?? []) as typeof rows;
  } catch {
    rows = [];
  }

  const lines = ["activity_id,datetime,user,module,content_name,action,prev_status,new_status,content_id"];
  for (const r of rows) {
    const nv = (r.new_value ?? {}) as Record<string, unknown>;
    lines.push([
      r.id,
      r.created_at,
      r.user_email ?? "system",
      r.entity_type ?? "",
      String(nv.name ?? ""),
      r.action,
      String(nv.prev_status ?? ""),
      String(nv.new_status ?? ""),
      r.entity_id ?? "",
    ]
      .map(csvCell)
      .join(","));
  }

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="activity-log.csv"`,
    },
  });
}

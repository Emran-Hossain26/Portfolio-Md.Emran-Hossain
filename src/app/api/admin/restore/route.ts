import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { adminConfigured, createServiceClient } from "@/lib/supabase/admin";

/**
 * Stage 7 — content backup IMPORT (the mirror of /api/admin/backup).
 * Accepts the JSON produced by the backup export and upserts every row by
 * its primary key. Guards: admin session + is_admin + an explicit
 * "confirm": field in the payload (a restore overwrites live content).
 */

const CONFLICT_KEY: Record<string, string> = {
  site_settings: "key",
  feature_flags: "key",
  sections: "key",
  page_seo: "path,lang",
};

const TABLES = [
  "site_settings",
  "feature_flags",
  "sections",
  "projects",
  "posts",
  "testimonials",
  "experience",
  "education",
  "services",
  "skills",
  "certifications",
  "faqs",
  "stats",
  "social_links",
  "contact_info",
  "media_assets",
  "messages",
  "page_seo",
  "redirects",
  "theme_presets",
  "newsletter_subscribers",
] as const;

export async function POST(req: NextRequest) {
  if (!adminConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (isAdmin !== true) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  let payload: { confirm?: string; data?: Record<string, unknown[]> };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  if (payload?.confirm !== "RESTORE") {
    return NextResponse.json(
      { error: 'Set "confirm": "RESTORE" in the payload to overwrite live content' },
      { status: 400 },
    );
  }
  const dump = payload.data;
  if (!dump || typeof dump !== "object") {
    return NextResponse.json({ error: "missing data object" }, { status: 400 });
  }

  const db = createServiceClient();
  const report: Record<string, number | string> = {};

  for (const table of TABLES) {
    const rows = dump[table];
    if (!Array.isArray(rows) || rows.length === 0) continue;
    const conflict = CONFLICT_KEY[table] ?? "id";
    try {
      // Chunked upserts (PostgREST URL length / payload sanity).
      for (let i = 0; i < rows.length; i += 200) {
        const chunk = rows.slice(i, i + 200);
        const { error } = await db.from(table).upsert(chunk, { onConflict: conflict });
        if (error) throw new Error(error.message);
      }
      report[table] = rows.length;
    } catch (e) {
      report[table] = "ERROR: " + (e instanceof Error ? e.message.slice(0, 120) : "failed");
    }
  }

  return NextResponse.json({ ok: true, report });
}

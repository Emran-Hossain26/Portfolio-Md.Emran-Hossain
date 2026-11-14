import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { adminConfigured, createServiceClient } from "@/lib/supabase/admin";

export const preferredRegion = "icn1"; // co-located with the Supabase Seoul region — cuts DB round-trip latency

/**
 * Content backup export (MISSING-TASKS A10): every admin-managed table as
 * JSON plus the media list. Auth is checked inline (API route — no admin
 * redirect): Supabase session + is_admin, else 401.
 */

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

  const db = createServiceClient();
  const dump: Record<string, unknown> = {
    _meta: {
      generated_at: new Date().toISOString(),
      generated_by: user.email ?? user.id,
      format: "portfolio-backup/v1",
    },
  };

  for (const table of TABLES) {
    try {
      const { data, error } = await db.from(table).select("*");
      dump[table] = error ? { error: error.message } : (data ?? []);
    } catch (e) {
      // Table missing (pre-migration) → note it and continue.
      dump[table] = {
        error: e instanceof Error ? e.message : "unavailable",
      };
    }
  }

  const json = JSON.stringify(dump, null, 2);
  const checksum = createHash("sha256").update(json).digest("hex").slice(0, 16);
  const date = new Date().toISOString().slice(0, 10);

  return new NextResponse(json, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="portfolio-backup-${date}-${checksum}.json"`,
      "Cache-Control": "no-store",
    },
  });
}

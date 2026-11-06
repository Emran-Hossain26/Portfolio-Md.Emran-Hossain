import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";

/**
 * CV download counter (MISSING-TASKS A9): the public "Download CV" button
 * points here; the hit is counted in site_settings (key "cv_downloads") and
 * the visitor is redirected to the stored public URL. Light rate limiting;
 * bots that ignore redirect targets anyway are skipped.
 */

const rateMap = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT = 20; // downloads per IP per hour
const RATE_WINDOW_MS = 60 * 60 * 1000;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || entry.reset < now) {
    rateMap.set(ip, { count: 1, reset: now + RATE_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT;
}

const BOT_UA = /bot|crawler|spider|slurp|bingpreview|facebookexternalhit|whatsapp|telegram|curl|wget|python|httpclient/i;

export async function GET(req: NextRequest) {
  let url = "";
  try {
    const db = createServiceClient();
    const { data } = await db
      .from("site_settings")
      .select("value")
      .eq("key", "cv_path")
      .maybeSingle();
    url = String((data?.value as { url?: string } | null)?.url ?? "");
  } catch {
    // fall through with empty url
  }

  if (!url) {
    return NextResponse.redirect(new URL("/", req.url), 302);
  }

  const ua = req.headers.get("user-agent") ?? "";
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  if (!BOT_UA.test(ua) && !rateLimited(ip)) {
    try {
      const db = createServiceClient();
      const { data } = await db
        .from("site_settings")
        .select("value")
        .eq("key", "cv_downloads")
        .maybeSingle();
      const next = (((data?.value as { count?: number } | null)?.count) ?? 0) + 1;
      await db
        .from("site_settings")
        .upsert({ key: "cv_downloads", value: { count: next } }, { onConflict: "key" });
    } catch {
      // Counting is best-effort; the download itself must never break.
    }
  }

  return NextResponse.redirect(url, 302);
}

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";

/**
 * First-party page-view tracking (MISSING-TASKS A8). The client beacon sends
 * only the page path/title/theme — no fingerprinting, no raw IP stored
 * (country comes from Vercel's geo header), DNT is honoured upstream in the
 * client component. Aggregation for the admin lives in SQL views.
 */

const rateMap = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT = 60; // events per IP per minute
const RATE_WINDOW_MS = 60_000;

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

const BOT_UA = /bot|crawler|spider|slurp|bingpreview|facebookexternalhit|whatsapp|telegram|curl|wget|python|httpclient|headless/i;
const PATH_RE = /^\/[A-Za-z0-9\-._~/?=&%]{0,300}$/;

function deviceFromUa(ua: string): string {
  if (/iPad|tablet/i.test(ua)) return "tablet";
  if (/Mobi|Android|iPhone/i.test(ua)) return "mobile";
  return "desktop";
}

export async function POST(req: NextRequest) {
  // Prefetch / RSC navigation requests must not count.
  if (req.headers.get("purpose") === "prefetch" || req.headers.get("x-middleware-prefetch")) {
    return NextResponse.json({ ok: true, skipped: "prefetch" });
  }
  const ua = req.headers.get("user-agent") ?? "";
  if (BOT_UA.test(ua)) {
    return NextResponse.json({ ok: true, skipped: "bot" });
  }

  let body: { path?: unknown; title?: unknown; referrer?: unknown; theme?: unknown; effects?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: true, skipped: "invalid" });
  }

  const path = typeof body.path === "string" ? body.path.split("?")[0].slice(0, 300) : "";
  if (!path || !PATH_RE.test(path)) {
    return NextResponse.json({ ok: true, skipped: "invalid" });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json({ ok: false, error: "rate limited" }, { status: 429 });
  }

  // Rotating 30-minute session cookie distinguishes visitors without any
  // client-side storage; never a tracking cookie across sites.
  let session = req.cookies.get("vt")?.value;
  const fresh = !session || !/^[0-9a-f-]{8,40}$/i.test(session);
  if (fresh) {
    session = crypto.randomUUID();
  }

  try {
    const db = createServiceClient();
    await db.from("visitor_events").insert({
      session_id: session!.slice(0, 40),
      page_path: path,
      page_title: typeof body.title === "string" ? body.title.slice(0, 200) : null,
      referrer: typeof body.referrer === "string" ? body.referrer.slice(0, 300) : null,
      country: req.headers.get("x-vercel-ip-country"),
      device_type: deviceFromUa(ua),
      theme: typeof body.theme === "string" ? body.theme.slice(0, 20) : null,
      effects_on: typeof body.effects === "boolean" ? body.effects : null,
    });
  } catch {
    // Pre-migration (no table yet) or DB hiccup — silently skip.
    return NextResponse.json({ ok: true, skipped: "storage" });
  }

  const res = NextResponse.json({ ok: true });
  if (fresh) {
    res.cookies.set("vt", session!, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 30,
      path: "/",
    });
  }
  return res;
}

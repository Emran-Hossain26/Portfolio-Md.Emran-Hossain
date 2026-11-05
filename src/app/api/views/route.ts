import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";

// In-memory rate limiter (per IP, per instance). Note: this is per-instance;
// on Vercel (multiple instances) each instance has its own counter. For
// global rate limiting, swap for Upstash Redis (Stage 8).
const rateMap = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT = 30; // requests per window
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

const BOT_UA = /bot|crawler|spider|slurp|bingpreview|facebookexternalhit|whatsapp|telegram|curl|wget|python|httpclient/i;
const SLUG_RE = /^[a-z0-9-]{1,120}$/;

export async function POST(req: NextRequest) {
  // Prefetch / RSC navigation requests must not count.
  if (req.headers.get("purpose") === "prefetch" || req.headers.get("x-middleware-prefetch")) {
    return NextResponse.json({ ok: true, skipped: "prefetch" });
  }
  const ua = req.headers.get("user-agent") ?? "";
  if (BOT_UA.test(ua)) {
    return NextResponse.json({ ok: true, skipped: "bot" });
  }

  let slug: string | undefined;
  try {
    const body = await req.json();
    slug = typeof body?.slug === "string" ? body.slug.trim() : undefined;
  } catch {
    return NextResponse.json({ ok: true, skipped: "invalid" });
  }
  // Validate slug format AND that it refers to a published, currently-visible post.
  // Return the same generic response for any invalid slug (no existence leak).
  if (!slug || !SLUG_RE.test(slug)) {
    return NextResponse.json({ ok: true, skipped: "invalid" });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  if (rateLimited(ip)) {
    return NextResponse.json({ ok: false, error: "rate limited" }, { status: 429 });
  }

  // Verify the slug refers to a published, currently-visible post.
  let valid = false;
  try {
    const db = createServiceClient();
    const { data } = await db
      .from("posts")
      .select("slug")
      .eq("slug", slug)
      .eq("status", "published")
      .or("scheduled_at.is.null,scheduled_at.lte." + new Date().toISOString())
      .maybeSingle();
    valid = !!data;
  } catch {
    // DB unavailable — accept the slug format only (best effort).
    valid = true;
  }
  if (!valid) {
    return NextResponse.json({ ok: true, skipped: "invalid" });
  }

  // Dedupe per visitor per post per 24h via cookie.
  const cookieName = `vc_${slug}`.slice(0, 60);
  const hasCookie = req.cookies.get(cookieName)?.value === "1";
  if (hasCookie) {
    return NextResponse.json({ ok: true, skipped: "deduped" });
  }

  // Increment (atomic RPC with direct-update fallback).
  try {
    const db = createServiceClient();
    try {
      await db.rpc("increment_post_views", { p_slug: slug });
    } catch {
      const { data } = await db.from("posts").select("view_count").eq("slug", slug).maybeSingle();
      const next = ((data?.view_count as number) ?? 0) + 1;
      await db.from("posts").update({ view_count: next }).eq("slug", slug);
    }
  } catch {}

  // Only set the dedupe cookie AFTER a successful increment attempt.
  const res = NextResponse.json({ ok: true });
  res.cookies.set(cookieName, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24,
    path: "/",
  });
  return res;
}
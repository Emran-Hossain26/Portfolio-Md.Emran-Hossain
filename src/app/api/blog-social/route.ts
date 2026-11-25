import { NextRequest, NextResponse } from "next/server";
import { getSocial, SLUG_RE, VOTER_COOKIE } from "@/lib/blog-social";

export const dynamic = "force-dynamic";

/** GET /api/blog-social?slug=<post slug> → likes, liked-by-me, approved comments. */
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug") ?? "";
  if (!SLUG_RE.test(slug)) return NextResponse.json({ ok: false }, { status: 400 });
  try {
    const voter = req.cookies.get(VOTER_COOKIE)?.value ?? null;
    const social = await getSocial(slug, voter);
    return NextResponse.json({ ok: true, ...social }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    // Tables not created yet (migration pending) or DB unavailable: show an empty, working UI.
    return NextResponse.json({ ok: true, likes: 0, liked: false, comments: [], unavailable: true });
  }
}

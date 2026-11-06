import { NextResponse } from "next/server";

/**
 * Stage 6 #13 — tells VISITORS their own country from the Vercel geo
 * header. Read-only, nothing logged or stored; unknown locally (empty).
 */
export async function GET(req: Request) {
  const country =
    req.headers.get("x-vercel-ip-country") ??
    "";
  return NextResponse.json(
    { country },
    { headers: { "Cache-Control": "no-store" } },
  );
}

import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { routing } from "./i18n/routing";

// Next.js 16 proxy convention (formerly middleware.ts).
// Routes public requests through the locale negotiator; /admin (outside
// the [locale] tree), APIs, static files and Next internals are excluded.
const intlMiddleware = createMiddleware(routing);

// DB-driven 301/302 redirects, cached via fetch-level revalidation (300s).
// No Date.now() — proxy runs during prerender and Date.now() is flagged as
// an unstable value by Next.js 16 (cacheComponents).
let redirectCache: { from_url: string; to_url: string; permanent: boolean }[] | null = null;

async function loadRedirects(): Promise<{ from_url: string; to_url: string; permanent: boolean }[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return redirectCache ?? [];
  try {
    const res = await fetch(`${url}/rest/v1/redirects?select=from_url,to_url,permanent`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      next: { revalidate: 300 },
    });
    if (!res.ok) return redirectCache ?? [];
    const list = (await res.json()) as { from_url: string; to_url: string; permanent: boolean }[];
    redirectCache = list;
    return list;
  } catch {
    return redirectCache ?? [];
  }
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // DB-driven 301/302 redirects (cached via fetch-level revalidation).
  const redirects = await loadRedirects();
  const match = redirects.find((r) => r.from_url === pathname);
  if (match) {
    const url = request.nextUrl.clone();
    url.pathname = match.to_url;
    return NextResponse.redirect(url, match.permanent ? 301 : 302);
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: "/((?!api|admin|login|_next|_vercel|.*\\..*).*)",
};
import { NextResponse, NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { createServerClient } from "@supabase/ssr";

// Next.js 16 proxy convention (formerly middleware.ts). Three jobs:
//  1. Stage 6 item 1 — proxy-level admin gate: a REAL 307 before any render,
//     so PPR shells of /admin pages are never served unauthenticated.
//  2. Stage 6 item 5 — per-request nonce + Content-Security-Policy on every
//     route; the [locale] layout reads x-nonce and stamps the inline
//     theme/effects scripts; Next propagates the nonce to its own scripts.
//  3. Locale negotiation for public pages + DB-driven redirects.

const intlMiddleware = createMiddleware(routing);

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

function cspFor(nonce: string): string {
  const scriptSrc = [
    "'self'",
    `'nonce-${nonce}'`,
    "'strict-dynamic'",
    "https://challenges.cloudflare.com",
  ].join(" ");
  return [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
    "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com data:",
    "img-src 'self' data: blob: https://*.supabase.co",
    "connect-src 'self' https://*.supabase.co https://api.github.com https://challenges.cloudflare.com",
    "frame-src https://challenges.cloudflare.com https://www.youtube.com https://player.vimeo.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Per-request nonce; forwarded to the app via x-nonce and pinned in CSP.
  const nonce = btoa(crypto.randomUUID().replaceAll("-", "")).replace(/=+$/, "");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("x-pathname", pathname);

  const isSkipped =
    pathname.startsWith("/api") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/login") ||
    pathname.includes(".");

  let response: NextResponse;
  if (isSkipped) {
    response = NextResponse.next({ request: { headers: requestHeaders } });
  } else {
    const redirects = await loadRedirects();
    const match = redirects.find((r) => r.from_url === pathname);
    if (match) {
      const url = request.nextUrl.clone();
      url.pathname = match.to_url;
      response = NextResponse.redirect(url, match.permanent ? 301 : 302);
    } else {
      const nonceRequest = new NextRequest(request.nextUrl, {
        headers: requestHeaders,
        method: request.method,
      });
      response = intlMiddleware(nonceRequest);
    }
  }

  // Stage 6 item 1 — proxy-level admin gate: a REAL 307 before any render,
  // so PPR shells of /admin pages are never served unauthenticated. The
  // nested layout + per-page/action guards stay as defense in depth.
  if (pathname.startsWith("/admin")) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          },
        },
      },
    );
    const { data: userData } = await supabase.auth.getUser();
    let ok = !!userData.user;
    if (ok) {
      const { data: isAdmin } = await supabase.rpc("is_admin");
      ok = isAdmin === true;
    }
    if (!ok) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url, 307);
    }
  }

  response.headers.set("Content-Security-Policy", cspFor(nonce));
  response.headers.set("X-Content-Type-Options", "nosniff");
  return response;
}

export const config = {
  matcher: "/((?!_next/static|_next/image|_vercel|favicon.ico|manifest.webmanifest|images/|fonts/).*)",
};

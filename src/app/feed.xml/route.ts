import { NextResponse } from "next/server";
import { siteUrl } from "@/data/site";

/**
 * The real feeds live at /en/feed.xml and /bn/feed.xml (locale-scoped).
 * The proxy matcher skips dotted paths, so the bare /feed.xml never gets
 * locale negotiation — redirect feed readers to the default locale feed
 * instead of rendering the home page.
 */
export async function GET() {
  return NextResponse.redirect(new URL("/en/feed.xml", siteUrl), 301);
}

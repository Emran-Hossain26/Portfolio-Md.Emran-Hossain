import { redirect } from "next/navigation";
import { connection } from "next/server";
import { routing } from "@/i18n/routing";
import { blogExternalUrl } from "@/data/site";

// Locale params only (same pattern as the other static [locale] pages).
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// Per-request redirect (nonce-CSP layout is dynamic — a prerendered page
// would otherwise swallow the redirect).
export const instant = false;

/**
 * Task U6: the blog moved off-site to Hashnode (site carries no posts —
 * faster pages, no duplicated content). Old links and the nav entry forward
 * to the external blog; the posts admin remains for any draft archive.
 */
export default async function BlogIndexPage() {
  await connection();
  redirect(blogExternalUrl);
}

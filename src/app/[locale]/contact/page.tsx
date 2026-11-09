import { hasLocale } from "next-intl";
import { connection } from "next/server";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { resolvePageMetadata } from "@/lib/seo";
import { Contact } from "@/components/home/Contact";
import type { Locale } from "@/data/types";

// Stage 6 item 5: nonce-CSP layout is dynamic — this page renders per request.
export const instant = false;

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const resolved = (hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale) as Locale;
  setRequestLocale(resolved);
  // Stage 6 item 5: nonce-CSP layout is dynamic — pages render on demand.
  await connection();

  // Contact component renders its own <section id="contact"> with an h2;
  // the sr-only h1 keeps one heading per page without changing its look.
  return (
    <main className="wrap" id="main">
      <h1 className="sr-only">Contact Md Emran Hossain</h1>
      <Contact />
    </main>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const resolved = (hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale) as Locale;
  const t = await getTranslations({
    locale: resolved,
    namespace: "meta.pages.contact",
  });
  return resolvePageMetadata(resolved, "/contact", t("title"), t("description"));
}

// Root locale param only (Stage 6: nonce CSP makes the layout dynamic).
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

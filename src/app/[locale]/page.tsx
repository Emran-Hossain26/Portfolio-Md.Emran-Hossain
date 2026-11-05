import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { resolvePageMetadata } from "@/lib/seo";
import { getContactInfo } from "@/lib/cms";
import type { Locale } from "@/data/types";
import { Hero } from "@/components/home/Hero";
import { Expertise } from "@/components/home/Expertise";
import { Projects } from "@/components/home/Projects";
import { Reviews } from "@/components/home/Reviews";
import { BlogPreview } from "@/components/home/BlogPreview";
import { Contact } from "@/components/home/Contact";
import { Certifications, Faq, Stats } from "@/components/home/Extras";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const resolved = (hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale) as Locale;
  const t = await getTranslations({ locale: resolved, namespace: "meta" });
  return resolvePageMetadata(resolved, "/", t("title"), t("description"));
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const resolved = hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale;
  setRequestLocale(resolved);

  const [contact] = await Promise.all([getContactInfo()]);

  // id="avail" — targeted by the visitor preview panel's availability toggle
  const availabilityChip = (
    <p className="chip on" id="avail">
      <i aria-hidden="true" />
      {resolved === "bn"
        ? contact.availability.bn || contact.availability.en
        : contact.availability.en || contact.availability.bn}
    </p>
  );

  return (
    <main className="wrap" id="main">
      {/* Hero stays un-revealed: it holds the LCP element. Sections below
          carry data-reveal — the lazy "Animation" module hides only what is
          below the fold and reveals it on first scroll. data-sec keys match
          the section toggles used by admin tooling. */}
      <Hero chip={availabilityChip} />
      <div data-reveal><Expertise /></div>
      <div data-reveal><Stats /></div>
      <div data-reveal><Projects /></div>
      <div data-reveal><Certifications /></div>
      <div data-reveal><Reviews /></div>
      <div data-reveal><Faq /></div>
      <div data-reveal><BlogPreview /></div>
      <div data-reveal><Contact /></div>
    </main>
  );
}



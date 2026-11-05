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
import { Reveal } from "@/components/Reveal";

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
      {/* Hero stays un-revealed: it holds the LCP element. Every section
          below the fold reveals on first scroll (skipped for reduced motion
          or when the visitor turns effects off). data-sec keys match the
          visitor preview panel's section toggles. */}
      <Hero chip={availabilityChip} />
      <Reveal><Expertise /></Reveal>
      <Reveal><Stats /></Reveal>
      <Reveal><Projects /></Reveal>
      <Reveal><Certifications /></Reveal>
      <Reveal><Reviews /></Reveal>
      <Reveal><Faq /></Reveal>
      <Reveal><BlogPreview /></Reveal>
      <Reveal><Contact /></Reveal>
    </main>
  );
}



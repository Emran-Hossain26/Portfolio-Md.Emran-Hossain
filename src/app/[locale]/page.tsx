import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { resolvePageMetadata } from "@/lib/seo";
import type { Locale } from "@/data/types";
import { Hero } from "@/components/home/Hero";
import { Expertise } from "@/components/home/Expertise";
import { Projects } from "@/components/home/Projects";
import { Reviews } from "@/components/home/Reviews";
import { BlogPreview } from "@/components/home/BlogPreview";
import { Contact } from "@/components/home/Contact";

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

  return (
    <main className="wrap" id="main">
      <Hero />
      <Expertise />
      <Projects />
      <Reviews />
      <BlogPreview />
      <Contact />
    </main>
  );
}

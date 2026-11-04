import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { pageMetadata, breadcrumbLd } from "@/lib/seo";
import { Breadcrumbs, PageHeading } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { Expertise } from "@/components/home/Expertise";
import type { Locale } from "@/data/types";

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const resolved = (hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale) as Locale;
  setRequestLocale(resolved);

  const t = await getTranslations("pages.about");
  const crumbs = await getTranslations("pages.crumbs");

  return (
    <main className="wrap" id="main">
      <Breadcrumbs items={[{ label: t("heading") }]} />
      <section>
        <PageHeading>{t("heading")}</PageHeading>
        <p>{t("intro")}</p>
      </section>
      <Expertise />
      <section>
        <h2>{t("expTitle")}</h2>
        <p className="mute">{t("expNote")}</p>
      </section>
      <section>
        <h2>{t("eduTitle")}</h2>
        <p className="mute">{t("eduNote")}</p>
      </section>
      <JsonLd
        data={breadcrumbLd([
          { name: crumbs("home"), path: "/" },
          { name: t("heading"), path: "/about" },
        ])}
      />
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
  const t = await getTranslations({ locale: resolved, namespace: "meta.pages.about" });
  return pageMetadata(resolved, "/about", t("title"), t("description"));
}

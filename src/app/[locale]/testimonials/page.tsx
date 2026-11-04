import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { pageMetadata } from "@/lib/seo";
import { placeholderTestimonials } from "@/data/testimonials";
import { pick, type Locale } from "@/data/types";

export default async function TestimonialsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const resolved = (hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale) as Locale;
  setRequestLocale(resolved);

  const t = await getTranslations("pages.testimonials");

  return (
    <main className="wrap" id="main">
      <section style={{ paddingTop: 32 }}>
        <h1 style={{ fontSize: 30, marginBottom: 26 }}>{t("heading")}</h1>
        <p>{t("intro")}</p>
        <div className="grid" style={{ marginTop: 26 }}>
          {placeholderTestimonials.map((item, index) => (
            <div className="card" key={index}>
              <blockquote>
                {pick(resolved, item.quote)}
                <footer>{pick(resolved, item.name)}</footer>
              </blockquote>
            </div>
          ))}
        </div>
        <p className="mute" style={{ marginTop: 18 }}>
          {t("moderation")}
        </p>
      </section>
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
    namespace: "meta.pages.testimonials",
  });
  return pageMetadata(resolved, "/testimonials", t("title"), t("description"));
}

import { connection } from "next/server";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { resolvePageMetadata } from "@/lib/seo";
import { getTestimonials } from "@/lib/cms";
import { TestimonialSubmitForm } from "@/components/TestimonialSubmitForm";
import { pick, type Locale } from "@/data/types";

// Stage 6 item 5: nonce-CSP layout is dynamic — this page renders per request.
export const instant = false;

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
  // Stage 6 item 5: nonce-CSP layout is dynamic — pages render on demand.
  await connection();

  const t = await getTranslations("pages.testimonials");
  const testimonials = await getTestimonials();

  return (
    <main className="wrap" id="main">
      <section style={{ paddingTop: 32 }}>
        <h1 style={{ fontSize: 30, marginBottom: 26 }}>{t("heading")}</h1>
        <p>{t("intro")}</p>
        <div className="grid" style={{ marginTop: 26 }}>
          {testimonials.map((item, index) => (
            <div className="card" key={index}>
              <blockquote>
                {pick(resolved, item.quote)}
                <footer>{item.name}</footer>
              </blockquote>
            </div>
          ))}
        </div>
        <p className="mute" style={{ marginTop: 18 }}>
          {t("moderation")}
        </p>
        <TestimonialSubmitForm />
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
  return resolvePageMetadata(resolved, "/testimonials", t("title"), t("description"));
}

// Root locale param only (Stage 6: nonce CSP makes the layout dynamic).
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

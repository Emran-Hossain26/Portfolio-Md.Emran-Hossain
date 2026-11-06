import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { resolvePageMetadata } from "@/lib/seo";
import { getServices } from "@/lib/cms";
import { pick, type Locale } from "@/data/types";
import { QuoteForm } from "@/components/QuoteForm";

/**
 * Stage 6 #8 — Services & packages with a request-a-quote form. The page
 * renders only when services_settings.enabled (checked via notFound());
 * the quote form honors its own quote_enabled flag.
 */
export async function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function ServicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const resolved = (hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale) as Locale;
  setRequestLocale(resolved);

  const t = await getTranslations({ locale: resolved, namespace: "meta.pages.services" });
  const rows = await getServices();

  return (
    <main className="wrap" id="main">
      <h1 style={{ fontSize: 30, marginBottom: 8 }}>{t("title")}</h1>
      <p className="mute" style={{ marginBottom: 24 }}>{t("description")}</p>

      <div className="grid" style={{ gap: 16 }}>
        {rows.map((s) => (
          <div className="card" key={s.id} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
              <h2 style={{ margin: 0, fontSize: 19 }}>{pick(resolved, s.title)}</h2>
              {s.price ? <b style={{ color: "var(--accent)", whiteSpace: "nowrap" }}>{s.price}</b> : null}
            </div>
            <p style={{ margin: 0, color: "var(--mute)" }}>{pick(resolved, s.desc)}</p>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 34, maxWidth: 760 }}>
        <QuoteForm />
      </div>
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
  const t = await getTranslations({ locale: resolved, namespace: "meta.pages.services" });
  return resolvePageMetadata(resolved, "/services", t("title"), t("description"));
}

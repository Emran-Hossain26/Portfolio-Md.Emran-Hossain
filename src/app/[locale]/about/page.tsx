import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { breadcrumbLd, resolvePageMetadata } from "@/lib/seo";
import { getExperience, getEducation } from "@/lib/cms";
import { Breadcrumbs, PageHeading } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { Expertise } from "@/components/home/Expertise";
import { pick, type Locale } from "@/data/types";

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
  const [experience, education] = await Promise.all([
    getExperience(),
    getEducation(),
  ]);

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
        {/* Admin-entered CV data; empty until the admin fills it in */}
        {experience.length > 0 ? (
          <div className="grid" style={{ marginTop: 18 }}>
            {experience.map((item, index) => (
              <div className="card" key={index}>
                <h3>{pick(resolved, item.role)}</h3>
                <p className="mute">
                  {[pick(resolved, item.org), item.period].filter(Boolean).join(" · ")}
                </p>
                {item.details ? <p>{item.details}</p> : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="mute">{t("expNote")}</p>
        )}
      </section>
      <section>
        <h2>{t("eduTitle")}</h2>
        {education.length > 0 ? (
          <div className="grid" style={{ marginTop: 18 }}>
            {education.map((item, index) => (
              <div className="card" key={index}>
                <h3>{pick(resolved, item.role)}</h3>
                <p className="mute">
                  {[pick(resolved, item.org), item.period].filter(Boolean).join(" · ")}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mute">{t("eduNote")}</p>
        )}
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
  return resolvePageMetadata(resolved, "/about", t("title"), t("description"));
}

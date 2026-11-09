import { connection } from "next/server";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { breadcrumbLd, resolvePageMetadata } from "@/lib/seo";
import { getExperience, getEducation, getAboutTexts, getModuleSettings, getSkills, getProjects, getContactInfo } from "@/lib/cms";
import { Breadcrumbs, PageHeading } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { Expertise } from "@/components/home/Expertise";
import { TerminalAbout } from "@/components/TerminalAbout";
import { GithubActivity } from "@/components/GithubActivity";
import { pick, type Locale } from "@/data/types";
import { site } from "@/data/site";

// Stage 6 item 5: nonce-CSP layout is dynamic — this page renders per request.
export const instant = false;

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
  // Stage 6 item 5: nonce-CSP layout is dynamic — pages render on demand.
  await connection();

  const t = await getTranslations("pages.about");
  const crumbs = await getTranslations("pages.crumbs");
  const [experience, education, aboutTexts, modules, skills, projects, contact] = await Promise.all([
    getExperience(),
    getEducation(),
    getAboutTexts(),
    getModuleSettings(),
    getSkills(),
    getProjects(),
    getContactInfo(),
  ]);

  // Admin-editable bio (site_settings: about_texts); messages are the seed
  // fallback. Blank lines separate paragraphs.
  const intro = aboutTexts
    ? (resolved === "bn" ? aboutTexts.bn || aboutTexts.en : aboutTexts.en || aboutTexts.bn)
    : t("intro");

  return (
    <main className="wrap" id="main">
      <Breadcrumbs items={[{ label: t("heading") }]} />
      <section>
        <PageHeading>{t("heading")}</PageHeading>
        {intro.split(String.fromCharCode(10,10)).map((para) => (
          <p key={para.slice(0, 16)} style={{ marginBottom: 14 }}>{para}</p>
        ))}
      </section>
      <Expertise />
      <section>
        <h2>{t("expTitle")}</h2>
        {/* Admin-entered CV data as a vertical timeline (Stage 6 #2); the
            line grows in via a CSS animation, dots mark each stop. */}
        {experience.length > 0 ? (
          <div
            className="cv-timeline"
            style={{ marginTop: 18, position: "relative", paddingLeft: 26, maxWidth: 760 }}
          >
            <span
              aria-hidden="true"
              style={{
                position: "absolute",
                left: 7,
                top: 4,
                bottom: 4,
                width: 2,
                background: "var(--line)",
                transformOrigin: "top",
                animation: "cvline .9s ease-out both",
              }}
            />
            <style>{`@keyframes cvline { from { transform: scaleY(0); } to { transform: scaleY(1); } }`}</style>
            <div style={{ display: "grid", gap: 18 }}>
              {experience.map((item, index) => (
                <div key={index} style={{ position: "relative" }}>
                  <span
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      left: -26,
                      top: 6,
                      width: 12,
                      height: 12,
                      borderRadius: 999,
                      background: "var(--accent)",
                      border: "2px solid var(--bg)",
                      boxSizing: "border-box",
                    }}
                  />
                  <div className="card" style={{ padding: "14px 16px" }}>
                    <h3 style={{ margin: 0 }}>{pick(resolved, item.role)}</h3>
                    <p className="mute" style={{ margin: "4px 0 0" }}>
                      {[pick(resolved, item.org), item.period].filter(Boolean).join(" · ")}
                    </p>
                    {item.details ? <p style={{ margin: "8px 0 0" }}>{item.details}</p> : null}
                  </div>
                </div>
              ))}
            </div>
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
      {/* Stage 6 #6 — interactive terminal (admin toggle) */}
      {modules.terminal ? (
        <section style={{ marginTop: 32 }}>
          <TerminalAbout
            name={site.name}
            role={resolved === "bn"
              ? "আইটি ইনফ্রাস্ট্রাকচার, সাইবারসিকিউরিটি ও ফুল-স্ট্যাক ইঞ্জিনিয়ার"
              : "IT Infrastructure, Cybersecurity & Full Stack Engineer"}
            email={contact.email || site.email}
            location={resolved === "bn" ? "ঢাকা, বাংলাদেশ" : "Dhaka, Bangladesh"}
            skills={skills.slice(0, 10).map((s) => s.name)}
            projects={projects.slice(0, 6).map((p) => ({
              title: p.title.en || p.title.bn,
              slug: p.slug,
            }))}
          />
        </section>
      ) : null}

      {/* Stage 6 #13 — optional GitHub activity widget */}
      {modules.github && modules.githubUsername ? (
        <section style={{ marginTop: 32, maxWidth: 560 }}>
          <GithubActivity username={modules.githubUsername} />
        </section>
      ) : null}

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

// Root locale param only (Stage 6: nonce CSP makes the layout dynamic).
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

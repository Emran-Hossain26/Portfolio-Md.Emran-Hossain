import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { resolvePageMetadata } from "@/lib/seo";
import { getProjects } from "@/lib/cms";
import type { Locale } from "@/data/types";
import { ProjectCard, type CardLabels } from "@/components/ProjectCard";

export default async function ProjectsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const resolved = (hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale) as Locale;
  setRequestLocale(resolved);

  const t = await getTranslations("pages.projects");
  const s = await getTranslations("sections");
  const projects = await getProjects();
  const labels: CardLabels = {
    problem: s("problem"),
    solution: s("solution"),
    live: s("liveDemo"),
    caseStudy: t("caseStudy"),
    slideOf: s("slideOf"),
    screenshot: s("screenshot"),
    slideJoin: s("slideJoin"),
    promoVideo: s("promoVideo"),
  };
  return (
    <main className="wrap" id="main">
      <section style={{ paddingTop: 32 }}>
        <h1 style={{ fontSize: 30, marginBottom: 26 }}>{t("heading")}</h1>
        <p>{t("intro")}</p>
        <div className="grid pj" style={{ marginTop: 26 }}>
          {projects.map((project) => (
            <ProjectCard
              key={project.slug}
              project={project}
              locale={resolved}
              labels={labels}
              caseStudy
            />
          ))}
        </div>
        <p className="mute" style={{ marginTop: 18 }}>
          {t("privateNote")}
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
  const t = await getTranslations({ locale: resolved, namespace: "meta.pages.projects" });
  return resolvePageMetadata(resolved, "/projects", t("title"), t("description"));
}

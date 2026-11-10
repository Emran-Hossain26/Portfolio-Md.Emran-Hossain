import { getLocale, getTranslations } from "next-intl/server";
import { getProjects } from "@/lib/cms";
import type { Locale } from "@/data/types";
import { ProjectCard, type CardLabels } from "@/components/ProjectCard";

export async function Projects() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("sections");
  const projects = await getProjects();
  const labels: CardLabels = {
    problem: t("problem"),
    solution: t("solution"),
    live: t("liveDemo"),
    caseStudy: t("caseStudy"),
    slideOf: t("slideOf"),
    slideJoin: t("slideJoin"),
    screenshot: t("screenshot"),
    promoVideo: t("promoVideo"),
  };

  return (
    <section id="projects" data-sec="projects">
      <h2 data-ac="text">{t("projects")}</h2>
      <div className="grid pj">
        {projects.map((project) => (
          <ProjectCard key={project.slug} project={project} locale={locale} labels={labels} />
        ))}
      </div>
    </section>
  );
}

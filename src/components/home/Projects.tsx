import { getLocale, getTranslations } from "next-intl/server";
import { projects } from "@/data/projects";
import { pick, type Locale } from "@/data/types";

export async function Projects() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("sections");

  return (
    <section id="projects">
      <h2>{t("projects")}</h2>
      <div className="grid">
        {projects.map((project) => {
          const body = (
            <>
              <h3>{pick(locale, project.title)}</h3>
              <p>{pick(locale, project.desc)}</p>
              <div className="tags">
                {project.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            </>
          );
          return project.href ? (
            <a
              key={project.title.en}
              className="card"
              href={project.href}
              style={{ textDecoration: "none" }}
            >
              {body}
            </a>
          ) : (
            <div className="card" key={project.title.en}>
              {body}
            </div>
          );
        })}
      </div>
    </section>
  );
}

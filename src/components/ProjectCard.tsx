import { pick, type Locale } from "@/data/types";
import type { Project } from "@/data/projects";
import { Link } from "@/i18n/navigation";
import { ProjectMedia, type MediaLabels } from "./ProjectMedia";

export type CardLabels = MediaLabels & {
  problem: string;
  solution: string;
  live: string;
  caseStudy: string;
};

/** EN with BN→EN fallback (Section 4c). */
export function text(locale: Locale, value: { en: string; bn?: string } | undefined): string {
  if (!value) return "";
  return locale === "bn" ? value.bn || value.en : value.en;
}

/**
 * A showcase card in the approved mockup style ("update info/index.html"):
 * 16:9 media area by media mode, title, Problem → Solution, tech tags and
 * the Live demo button only when demo_url is set. `caseStudy` adds the local
 * case-study link (used on the /projects page).
 */
export function ProjectCard({
  project,
  locale,
  labels,
  caseStudy = false,
}: {
  project: Project;
  locale: Locale;
  labels: CardLabels;
  caseStudy?: boolean;
}) {
  return (
    <article className="card" data-ac="box">
      <ProjectMedia project={project} locale={locale} labels={labels} />
      <h3 data-ac="text">{pick(locale, project.title)}</h3>
      {project.problem && (
        <>
          <h4 data-ac="text">{labels.problem}</h4>
          <p data-ac="text">{text(locale, project.problem)}</p>
        </>
      )}
      {project.solution && (
        <>
          <h4 data-ac="text">{labels.solution}</h4>
          <p data-ac="text">{text(locale, project.solution)}</p>
        </>
      )}
      <div className="tags">
        {project.tech.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
      {(project.demo_url || caseStudy) && (
        <div className="row">
          {project.demo_url && (
            <a
              className="btn p"
              style={{ fontSize: 14, padding: "8px 14px" }}
              href={project.demo_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {labels.live}
            </a>
          )}
          {caseStudy && (
            <Link className="btn" href={`/projects/${project.slug}`}>
              {labels.caseStudy}
            </Link>
          )}
        </div>
      )}
    </article>
  );
}

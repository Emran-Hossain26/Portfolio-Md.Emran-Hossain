import { pick, type Locale } from "@/data/types";
import type { Project } from "@/data/projects";
import { Link } from "@/i18n/navigation";
import { ProjectMedia, type MediaLabels } from "./ProjectMedia";

export type CardLabels = MediaLabels & {
  problem: string;
  solution: string;
  live: string;
  caseStudy: string;
  /** Stage U2: "Running" badge label for status === "running". */
  running?: string;
  /** Stage U2: "Source" button label for repo_url. */
  source?: string;
};

/** EN with BN→EN fallback (Section 4c). */
export function text(locale: Locale, value: { en: string; bn?: string } | undefined): string {
  if (!value) return "";
  return locale === "bn" ? value.bn || value.en : value.en;
}

/** Deployment-status labels (stored EN in the admin `category` field) with
 *  owner-reviewed Bengali translations. Prefix matching handles the
 *  "formal handover pending" suffix on the IT Management System. */
const STATUS_BN: [string, string][] = [
  ["Operational — Local network · formal handover pending", "অভ্যন্তরীণ নেটওয়ার্কে চালু · আনুষ্ঠানিক হস্তান্তর বাকি"],
  ["Operational — Local network", "অভ্যন্তরীণ নেটওয়ার্কে চালু"],
  ["Published — publicly accessible", "প্রকাশিত"],
  ["Project ready — not yet published", "প্রস্তুত, এখনো প্রকাশিত নয়"],
];
function statusBn(category: string): string | undefined {
  for (const [en, bn] of STATUS_BN) if (category === en || category.startsWith(en)) return bn;
  return undefined;
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
      {project.status === "running" && (
        <span
          data-ac="text"
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            zIndex: 2,
            fontSize: 12,
            fontWeight: 600,
            borderRadius: 999,
            padding: "3px 10px",
            background: "var(--ok, #13805a)",
            color: "#fff",
          }}
        >
          {labels.running ?? "Running"}
        </span>
      )}
      <h3 data-ac="text">{pick(locale, project.title)}</h3>
      {/* Task content update: deployment status label from the admin `category`
          field — distinguishes operational (local network), published and
          not-yet-published projects honestly. Bengali labels reviewed by the
          portfolio owner; EN text is the stored admin value. */}
      {project.category && (
        <p
          data-ac="text"
          style={{
            margin: "-2px 0 10px",
            fontSize: 12.5,
            color: "var(--accent, #2F6BFF)",
            fontWeight: 600,
            letterSpacing: "0.02em",
          }}
        >
          {locale === "bn" ? statusBn(project.category) ?? project.category : project.category}
        </p>
      )}
      {project.problem && (
        <>
          <h4 data-ac="text">{labels.problem}</h4>
          <p data-ac="text" className="clamp-4">{text(locale, project.problem)}</p>
        </>
      )}
      {project.solution && (
        <>
          <h4 data-ac="text">{labels.solution}</h4>
          <p data-ac="text" className="clamp-4">{text(locale, project.solution)}</p>
        </>
      )}
      {/* Task: IT Management System — compact expandable 20-module list.
          Native <details> = keyboard + aria for free; light, no re-renders. */}
      {project.modules?.length ? (
        <details className="module-list">
          <summary>
            <span className="module-summary-text">
              {locale === "bn"
                ? `সব ${project.modules.length}টি মডিউল দেখুন`
                : `View all ${project.modules.length} modules`}
            </span>
            <span className="module-chevron" aria-hidden="true">▾</span>
          </summary>
          <ul className="module-grid">
            {project.modules.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </details>
      ) : null}
      <div className="tags">
        {project.tech.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
      {(project.live_url || project.demo_url || project.repo_url || caseStudy) && (
        <div className="row">
          {(project.live_url || project.demo_url) && (
            <a
              className="btn p"
              style={{ fontSize: 14, padding: "8px 14px" }}
              href={project.live_url || project.demo_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {labels.live}
            </a>
          )}
          {project.repo_url && (
            <a
              className="btn"
              style={{ fontSize: 14, padding: "8px 14px" }}
              href={project.repo_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {labels.source ?? "Source"}
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

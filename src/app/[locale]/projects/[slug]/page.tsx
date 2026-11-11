import { hasLocale } from "next-intl";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";

// Root locale param only (Stage 6: nonce CSP makes the layout dynamic;
// slugs render on demand).
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
import { pageMetadata, breadcrumbLd } from "@/lib/seo";
import { siteUrl } from "@/data/site";
import { getProject, getProjects } from "@/lib/cms";
import { Breadcrumbs, PageHeading } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { pick, type Locale } from "@/data/types";
import { ProjectMedia, type MediaLabels } from "@/components/ProjectMedia";
import { text } from "@/components/ProjectCard";

// Stage 6 item 5: nonce-CSP layout is dynamic — this page renders per request.
export const instant = false;


export default async function ProjectPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const resolved = (hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale) as Locale;
  setRequestLocale(resolved);
  // Stage 6 item 5: nonce-CSP layout is dynamic — pages render on demand.
  await connection();

  const project = await getProject(slug);
  if (!project) notFound();

  const t = await getTranslations("pages.projects");
  const s = await getTranslations("sections");
  const crumbs = await getTranslations("pages.crumbs");

  const mediaLabels: MediaLabels = {
    slideOf: s("slideOf"),
    slideJoin: s("slideJoin"),
    screenshot: s("screenshot"),
    promoVideo: s("promoVideo"),
  };

  return (
    <main className="wrap" id="main">
      <Breadcrumbs
        items={[
          { label: crumbs("projects"), href: "/projects" },
          { label: pick(resolved, project.title) },
        ]}
      />
      <section style={{ paddingTop: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <PageHeading>{pick(resolved, project.title)}</PageHeading>
          {project.status === "running" && (
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                borderRadius: 999,
                padding: "3px 10px",
                background: "var(--ok, #13805a)",
                color: "#fff",
              }}
            >
              {s("running")}
            </span>
          )}
        </div>

        {/* Case-study layout in the approved showcase style: media area +
            Problem → Solution side by side, stacked on mobile. */}
        <div className="pj-detail">
          <div>
            <ProjectMedia project={project} locale={resolved} labels={mediaLabels} />
          </div>
          <div>
            {project.problem ? (
              <>
                <h4>{s("problem")}</h4>
                <p>{text(resolved, project.problem)}</p>
              </>
            ) : null}
            {project.solution ? (
              <>
                <h4>{s("solution")}</h4>
                <p>{text(resolved, project.solution)}</p>
              </>
            ) : null}
            <div className="tags">
              {project.tech.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
            {(project.live_url || project.demo_url || project.repo_url) ? (
              <div className="row">
                {(project.live_url || project.demo_url) && (
                  <a
                    className="btn p"
                    href={project.live_url || project.demo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t("live")}
                  </a>
                )}
                {project.repo_url && (
                  <a className="btn" href={project.repo_url} target="_blank" rel="noopener noreferrer">
                    {s("source")}
                  </a>
                )}
              </div>
            ) : null}
          </div>
        </div>

        <p className="mute" style={{ marginTop: 18 }}>
          {t("stackNote")}
        </p>
      </section>

      {/* Case-study outcome (Stage 6 #1): result paragraph + metrics. */}
      {project.result || project.metrics?.length ? (
        <section style={{ marginTop: 28 }}>
          <h2 style={{ fontSize: 22 }}>{s("result")}</h2>
          {project.result ? <p style={{ maxWidth: 760 }}>{text(resolved, project.result)}</p> : null}
          {project.metrics?.length ? (
            <div
              style={{
                display: "grid",
                gap: 12,
                gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                marginTop: 14,
              }}
            >
              {project.metrics.map((m, i) => (
                <div className="card" key={i} style={{ padding: "14px 16px" }}>
                  <b
                    style={{
                      display: "block",
                      fontSize: 24,
                      color: "var(--accent)",
                      fontFamily: "var(--font-sora), sans-serif",
                    }}
                  >
                    {m.value}
                  </b>
                  <span className="mute" style={{ fontSize: 13 }}>
                    {m.label}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}
      <JsonLd
        data={breadcrumbLd([
          { name: crumbs("home"), path: "/" },
          { name: crumbs("projects"), path: "/projects" },
          { name: pick(resolved, project.title), path: `/projects/${project.slug}` },
        ])}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: pick(resolved, project.title),
          description: text(resolved, project.solution ?? project.problem),
          applicationCategory: "WebApplication",
          operatingSystem: "Web",
          author: { "@type": "Person", name: "Md Emran Hossain" },
          url: project.demo_url || `${siteUrl}/projects/${project.slug}`,
        }}
      />
    </main>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const resolved = (hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale) as Locale;
  const project = await getProject(slug);
  if (!project) return {};
  const meta = pageMetadata(
    resolved,
    `/projects/${project.slug}`,
    `${pick(resolved, project.title)} | ${resolved === "en" ? "Md Emran Hossain" : "মোঃ ইমরান হোসেন"}`,
    text(resolved, project.solution ?? project.problem),
  );
  if (project.og_image) {
    meta.openGraph = { ...meta.openGraph, images: [project.og_image] };
    meta.twitter = { ...meta.twitter, images: [project.og_image] };
  }
  return meta;
}

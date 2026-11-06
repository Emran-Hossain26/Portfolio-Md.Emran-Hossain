import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { pageMetadata, breadcrumbLd } from "@/lib/seo";
import { siteUrl } from "@/data/site";
import { getProject, getProjects } from "@/lib/cms";
import { Breadcrumbs, PageHeading } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { pick, type Locale } from "@/data/types";
import { ProjectMedia, type MediaLabels } from "@/components/ProjectMedia";
import { text } from "@/components/ProjectCard";

export async function generateStaticParams() {
  // CMS-backed project slugs at build time.
  const projects = await getProjects();
  return routing.locales.flatMap((locale) =>
    projects.map((project) => ({ locale, slug: project.slug })),
  );
}

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
        <PageHeading>{pick(resolved, project.title)}</PageHeading>

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
            {project.demo_url ? (
              <div className="row">
                <a
                  className="btn p"
                  href={project.demo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t("live")}
                </a>
              </div>
            ) : null}
          </div>
        </div>

        <p className="mute" style={{ marginTop: 18 }}>
          {t("stackNote")}
        </p>
      </section>
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

import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { pageMetadata, breadcrumbLd } from "@/lib/seo";
import { Breadcrumbs, PageHeading } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { getProject, projects } from "@/data/projects";
import { pick, type Locale } from "@/data/types";

export function generateStaticParams() {
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

  const project = getProject(slug);
  if (!project) notFound();

  const t = await getTranslations("pages.projects");
  const crumbs = await getTranslations("pages.crumbs");

  return (
    <main className="wrap" id="main">
      <Breadcrumbs
        items={[
          { label: crumbs("projects"), href: "/projects" },
          { label: pick(resolved, project.title) },
        ]}
      />
      <section>
        <PageHeading>{pick(resolved, project.title)}</PageHeading>
        <p>{pick(resolved, project.desc)}</p>
        {project.href ? (
          <p style={{ marginTop: 18 }}>
            <a
              className="btn"
              href={project.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("live")}
            </a>
          </p>
        ) : null}
        <div className="tags" style={{ marginTop: 18 }}>
          {project.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
        <p className="mute" style={{ marginTop: 18 }}>
          {t("privateNote")}
        </p>
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
  const project = getProject(slug);
  if (!project) return {};
  return pageMetadata(
    resolved,
    `/projects/${project.slug}`,
    `${pick(resolved, project.title)} | ${resolved === "en" ? "Md Emran Hossain" : "মোঃ ইমরান হোসেন"}`,
    pick(resolved, project.desc),
  );
}

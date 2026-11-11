import { requireAdmin } from "@/lib/supabase/admin-auth";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { ProjectForm } from "@/components/admin/ProjectForm";
import { fetchCmsRow } from "../../cms/data";
import type { Slide } from "@/components/admin/SlidesEditor";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const s = (v: unknown) => String(v ?? "");
const arr = (v: unknown) => (Array.isArray(v) ? v : []);

export default async function AdminProjectEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;
  if (!UUID_RE.test(id)) notFound();
  const row = await fetchCmsRow("projects", id);
  if (!row) notFound();

  const slides = arr(row.slides).filter(
    (x): x is Slide => typeof x === "object" && x !== null && typeof (x as Slide).src === "string"
  );
  const metrics = arr(row.metrics).map((m) => {
    const o = m as { label?: unknown; value?: unknown };
    return { label: s(o.label), value: s(o.value) };
  });

  return (
    <AdminShell current="/admin/projects" heading="Edit project">
      <ProjectForm
        id={id}
        error={sp.error}
        row={{
          slug: s(row.slug),
          title_en: s(row.title_en),
          title_bn: s(row.title_bn),
          problem_en: s(row.problem_en),
          problem_bn: s(row.problem_bn),
          solution_en: s(row.solution_en),
          solution_bn: s(row.solution_bn),
          result_en: s(row.result_en),
          result_bn: s(row.result_bn),
          metrics,
          tech: arr(row.tech).map(s),
          cover_url: s(row.cover_url),
          category: s(row.category),
          project_type: s(row.project_type),
          role_en: s(row.role_en),
          role_bn: s(row.role_bn),
          features_en: s(row.features_en),
          features_bn: s(row.features_bn),
          media: s(row.media) || "slides",
          video: s(row.video),
          slides,
          demo_url: s(row.demo_url),
          live_url: s(row.live_url),
          repo_url: s(row.repo_url),
          status: s(row.status) || "completed",
          pub_status: s(row.pub_status) || (row.published !== false ? "published" : "draft"),
          featured: row.featured === true,
          sort_order: Number(row.sort_order ?? 0) || 0,
          seo: {
            slug: s(row.slug),
            seo_title_en: s(row.seo_title_en),
            seo_title_bn: s(row.seo_title_bn),
            seo_desc_en: s(row.seo_desc_en),
            seo_desc_bn: s(row.seo_desc_bn),
            seo_keywords: s(row.seo_keywords),
            og_image: s(row.og_image),
            canonical: s(row.canonical),
            noindex: row.noindex === true,
          },
        }}
      />
    </AdminShell>
  );
}

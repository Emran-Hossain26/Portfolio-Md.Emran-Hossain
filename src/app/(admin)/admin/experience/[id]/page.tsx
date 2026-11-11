import { requireAdmin } from "@/lib/supabase/admin-auth";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { ExperienceForm } from "@/components/admin/ExperienceForm";
import { fetchCmsRow } from "../../cms/data";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const s = (v: unknown) => String(v ?? "");
const arr = (v: unknown) => (Array.isArray(v) ? v : []);

export default async function AdminExperienceEditPage({
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
  const row = await fetchCmsRow("experience", id);
  if (!row) notFound();

  return (
    <AdminShell current="/admin/experience" heading="Edit experience">
      <ExperienceForm
        id={id}
        error={sp.error}
        row={{
          slug: s(row.slug),
          role_en: s(row.role_en),
          role_bn: s(row.role_bn),
          org_en: s(row.org_en),
          org_bn: s(row.org_bn),
          logo_url: s(row.logo_url),
          website_url: s(row.website_url),
          employment_type: s(row.employment_type),
          start_date: s(row.start_date),
          end_date: s(row.end_date),
          is_current: row.is_current === true,
          period: s(row.period),
          summary_en: s(row.summary_en),
          summary_bn: s(row.summary_bn),
          details: s(row.details),
          achievements_en: s(row.achievements_en),
          achievements_bn: s(row.achievements_bn),
          tags: arr(row.tags).map(s),
          pub_status: s(row.pub_status) || (row.published !== false ? "published" : "draft"),
          featured: row.featured === true,
          sort: Number(row.sort ?? 0) || 0,
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

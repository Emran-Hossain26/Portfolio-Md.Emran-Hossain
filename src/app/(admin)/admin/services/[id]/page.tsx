import { requireAdmin } from "@/lib/supabase/admin-auth";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { ServiceForm } from "@/components/admin/ServiceForm";
import { fetchCmsRow } from "../../cms/data";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const s = (v: unknown) => String(v ?? "");
const arr = (v: unknown) => (Array.isArray(v) ? v : []);

export default async function AdminServiceEditPage({
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
  const row = await fetchCmsRow("services", id);
  if (!row) notFound();

  return (
    <AdminShell current="/admin/services" heading="Edit service">
      <ServiceForm
        id={id}
        error={sp.error}
        row={{
          slug: s(row.slug),
          title_en: s(row.title_en),
          title_bn: s(row.title_bn),
          desc_en: s(row.desc_en),
          desc_bn: s(row.desc_bn),
          full_desc_en: s(row.full_desc_en),
          full_desc_bn: s(row.full_desc_bn),
          icon: s(row.icon),
          icon_svg: s(row.icon_svg),
          image_url: s(row.image_url),
          features_en: s(row.features_en),
          features_bn: s(row.features_bn),
          tags: arr(row.tags).map(s),
          price: s(row.price),
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

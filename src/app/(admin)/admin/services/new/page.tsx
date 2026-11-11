import { requireAdmin } from "@/lib/supabase/admin-auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { ServiceForm } from "@/components/admin/ServiceForm";

const BLANK = {
  slug: "",
  title_en: "",
  title_bn: "",
  desc_en: "",
  desc_bn: "",
  full_desc_en: "",
  full_desc_bn: "",
  icon: "",
  icon_svg: "",
  image_url: "",
  features_en: "",
  features_bn: "",
  tags: [] as string[],
  price: "",
  pub_status: "draft",
  featured: false,
  sort_order: 0,
  seo: {
    slug: "",
    seo_title_en: "",
    seo_title_bn: "",
    seo_desc_en: "",
    seo_desc_bn: "",
    seo_keywords: "",
    og_image: "",
    canonical: "",
    noindex: false,
  },
};

export default async function AdminServiceNewPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  return (
    <AdminShell current="/admin/services" heading="Add new service">
      <ServiceForm id="__new" row={BLANK} error={sp.error} isNew />
    </AdminShell>
  );
}

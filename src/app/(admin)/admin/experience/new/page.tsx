import { requireAdmin } from "@/lib/supabase/admin-auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { ExperienceForm } from "@/components/admin/ExperienceForm";

const BLANK = {
  slug: "",
  role_en: "",
  role_bn: "",
  org_en: "",
  org_bn: "",
  logo_url: "",
  website_url: "",
  employment_type: "",
  start_date: "",
  end_date: "",
  is_current: false,
  period: "",
  summary_en: "",
  summary_bn: "",
  details: "",
  achievements_en: "",
  achievements_bn: "",
  tags: [] as string[],
  pub_status: "draft",
  featured: false,
  sort: 0,
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

export default async function AdminExperienceNewPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  return (
    <AdminShell current="/admin/experience" heading="Add new experience">
      <ExperienceForm id="__new" row={BLANK} error={sp.error} isNew />
    </AdminShell>
  );
}

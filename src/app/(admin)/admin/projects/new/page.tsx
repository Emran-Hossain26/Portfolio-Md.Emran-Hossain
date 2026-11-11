import { requireAdmin } from "@/lib/supabase/admin-auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { ProjectForm } from "@/components/admin/ProjectForm";

const BLANK = {
  slug: "",
  title_en: "",
  title_bn: "",
  problem_en: "",
  problem_bn: "",
  solution_en: "",
  solution_bn: "",
  result_en: "",
  result_bn: "",
  metrics: [],
  tech: [] as string[],
  cover_url: "",
  category: "",
  project_type: "",
  role_en: "",
  role_bn: "",
  features_en: "",
  features_bn: "",
  media: "slides",
  video: "",
  slides: [],
  demo_url: "",
  live_url: "",
  repo_url: "",
  status: "completed",
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

export default async function AdminProjectNewPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  return (
    <AdminShell current="/admin/projects" heading="Add new project">
      <ProjectForm id="__new" row={BLANK} error={sp.error} isNew />
    </AdminShell>
  );
}

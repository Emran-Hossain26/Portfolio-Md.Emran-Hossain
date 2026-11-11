import { requireAdmin } from "@/lib/supabase/admin-auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { CmsManager } from "@/components/admin/CmsManager";
import { fetchCmsRows, type CmsModule, type CmsTab } from "./data";

const HEADINGS: Record<CmsModule, string> = {
  projects: "My Projects",
  services: "What I Do (Services)",
  experience: "Experience",
};

const NOTES: Record<CmsModule, string> = {
  projects: "Draft → Publish → Unpublish → Archive → Trash → Restore. Only Published projects appear on the public site.",
  services: "Same lifecycle as projects. Only Published services appear in the public “What I do” section.",
  experience: "Same lifecycle as projects. Only Published experiences appear on the public Experience timeline.",
};

/** Shared dashboard page body for all three CMS modules. */
export async function CmsDashboard({
  module,
  base,
  searchParams,
}: {
  module: CmsModule;
  base: string;
  searchParams: Promise<{ tab?: string; saved?: string; error?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const tab = (["all", "published", "drafts", "unpublished", "archived", "trash"].includes(sp.tab ?? "") ? sp.tab : "all") as CmsTab;
  const { rows, hasU4 } = await fetchCmsRows(module, tab);

  return (
    <AdminShell current={base} heading={HEADINGS[module]}>
      <p className="admin-note">{NOTES[module]}</p>
      <CmsManager module={module} base={base} rows={rows} tab={tab} saved={sp.saved} error={sp.error} hasU4={hasU4} />
    </AdminShell>
  );
}
